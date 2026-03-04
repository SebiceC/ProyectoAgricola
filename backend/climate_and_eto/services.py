import requests
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from django.conf import settings
from .eto_formules import ETOFormulas
from .models import DailyWeather, IrrigationSettings
from django.core.exceptions import ObjectDoesNotExist
from .bussiness_logic.nasa_power_api import NASAPowerAPI

logger = logging.getLogger(__name__)

# =============================================================================
#  HERRAMIENTAS DE DIAGNÓSTICO
# =============================================================================
def print_debug_header(title):
    print(f"\n{'='*60}")
    print(f" 🕵️‍♂️ DIAGNÓSTICO: {title}")
    print(f"{'='*60}")

def print_month_stats(df_grouped):
    print("\n📊 PROMEDIOS (Validación Interna):")
    print("-" * 95)
    print(f"{'Mes':<4} | {'TMax':<8} | {'Rad':<8} | {'PENMAN':<8} | {'HARG':<8}")
    print("-" * 95)
    # Verificamos si las columnas existen antes de imprimir para evitar errores
    cols = ['temp_max', 'radiation', 'PENMAN', 'HARGREAVES']
    available_cols = [c for c in cols if c in df_grouped.columns]
    
    for index, row in df_grouped.iterrows():
        vals = [f"{row[c]:<8.2f}" for c in available_cols]
        print(f"{index:<4} | {' | '.join(vals)}")
    print("-" * 95)

# =============================================================================
#  1. MOTOR DE CÁLCULO VECTORIAL (PRIVADO Y REUTILIZABLE)
# =============================================================================

def _fetch_and_calculate_vectors(lat, lon, start_date, end_date, elevation=0):
    """
    Función auxiliar: Baja datos de NASA y calcula TODAS las fórmulas vectorialmente.
    Devuelve un DataFrame listo para ser analizado (Gráfica) o guardado (Sync).
    """
    nasa_api = NASAPowerAPI()
    try:
        raw_data = nasa_api.get_daily_data(lat, lon, start_date, end_date)
    except Exception as e:
        raise ValueError(f"Error conectando a NASA: {str(e)}")

    if not raw_data:
        raise ValueError("No se encontraron datos climáticos para el rango seleccionado.")

    # Convertir a DataFrame
    df = pd.DataFrame.from_dict(raw_data, orient='index')
    df.index = pd.to_datetime(df.index)
    
    # Limpieza de tipos
    cols = ['temp_max', 'temp_min', 'temp_avg', 'humidity', 'wind_speed', 'radiation', 'pressure']
    for col in cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    df['day_of_year'] = df.index.dayofyear
    df['month'] = df.index.month

    # Lógica de cálculo por fila (elevation capturada por closure)
    elev = elevation  # Captura para uso en closure

    def calculate_daily_row(row):
        t_max = row.get('temp_max')
        t_min = row.get('temp_min')
        t_avg = row.get('temp_avg')
        rh = row.get('humidity')
        ws = row.get('wind_speed') 
        rs = row.get('radiation') 
        doy = row['day_of_year']
        
        # Validar mínimos vitales
        if pd.isna(t_avg) or pd.isna(rs): 
            return pd.Series({k: 0 for k in ['PENMAN', 'HARGREAVES', 'TURC']})

        res = {}
        
        # --- BLOQUE DE FÓRMULAS (elevation inyectada) ---
        try:
            if pd.notna(ws) and pd.notna(rh):
                res['PENMAN'] = ETOFormulas.penman_monteith(t_max, t_min, rh, ws, lat, doy, elev, solar_radiation=rs)
            else: res['PENMAN'] = 0
        except: res['PENMAN'] = 0

        try: res['HARGREAVES'] = ETOFormulas.hargreaves(t_max, t_min, t_avg, lat, doy)
        except: res['HARGREAVES'] = 0

        try:
            if pd.notna(rh): res['TURC'] = ETOFormulas.turc(t_avg, rh, rs)
            else: res['TURC'] = 0
        except: res['TURC'] = 0
        
        try: res['PRIESTLEY'] = ETOFormulas.priestley_taylor(t_avg, rs, elev)
        except: res['PRIESTLEY'] = 0

        try: res['MAKKINK'] = ETOFormulas.makkink(t_avg, rs, elev)
        except: res['MAKKINK'] = 0
        
        try: res['MAKKINK_ABSTEW'] = ETOFormulas.makkink_abstew(t_avg, rs, elev)
        except: res['MAKKINK_ABSTEW'] = 0

        try:
            if pd.notna(rh): res['IVANOV'] = ETOFormulas.ivanov(t_avg, rh)
            else: res['IVANOV'] = 0
        except: res['IVANOV'] = 0

        try:
            if pd.notna(ws) and pd.notna(rh): res['CHRISTIANSEN'] = ETOFormulas.christiansen(t_max, t_min, rh, ws, rs, lat, doy, elev)
            else: res['CHRISTIANSEN'] = 0
        except: res['CHRISTIANSEN'] = 0
        
        try:
             if hasattr(ETOFormulas, 'simple_abstew'): res['SIMPLE_ABSTEW'] = ETOFormulas.simple_abstew(t_max, t_min, rs)
             else: res['SIMPLE_ABSTEW'] = 0
        except: res['SIMPLE_ABSTEW'] = 0

        return pd.Series(res)

    # Aplicar vectores
    eto_columns = df.apply(calculate_daily_row, axis=1)
    df = pd.concat([df, eto_columns], axis=1)
    
    return df

# =============================================================================
#  2. SERVICIOS DE ANÁLISIS Y SINCRONIZACIÓN
# =============================================================================

def get_historical_climatology(user, lat, lon, start_date, end_date, elevation=0):
    """
    MODO LECTURA: Genera datos para la gráfica.
    NO guarda en base de datos (evita ensuciar la operación diaria).
    """
    print_debug_header(f"Generando Gráfica Histórica ({start_date} a {end_date}) [Elev={elevation}m]")
    
    # 1. Calcular en memoria
    df = _fetch_and_calculate_vectors(lat, lon, start_date, end_date, elevation=elevation)

    # 2. Agregación Mensual
    formula_cols = ['PENMAN', 'HARGREAVES', 'TURC', 'PRIESTLEY', 'MAKKINK', 
                    'MAKKINK_ABSTEW', 'IVANOV', 'CHRISTIANSEN', 'SIMPLE_ABSTEW']
    valid_cols = [c for c in formula_cols if c in df.columns]
    
    monthly_stats = df.groupby('month')[valid_cols].mean().reset_index()
    
    # Diagnóstico en consola
    print_month_stats(df.groupby('month')[['temp_max', 'radiation'] + valid_cols[:2]].mean())

    results = []
    for _, row in monthly_stats.iterrows():
        month_idx = int(row['month'])
        month_name = datetime(2000, month_idx, 1).strftime('%B')
        eto_results = row[valid_cols].to_dict()
        eto_results = {k: (max(0, v) if pd.notna(v) else 0) for k, v in eto_results.items()}

        results.append({
            "month": month_idx,
            "month_name": month_name,
            "eto_results": eto_results
        })

    return results


def sync_historical_to_daily(user, lat, lon):
    """
    MODO ESCRITURA: Toma el último año de datos y lo inyecta en la tabla operativa.
    Usa la fórmula preferida del usuario para definir el valor de 'eto_mm'.
    """
    print_debug_header(f"💾 SINCRONIZANDO DATOS A OPERACIÓN DIARIA ({user.username})")
    
    # 1. Definir rango: Último año hasta HOY
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=365)
    
    # 2. Calcular datos (Reutilizamos la lógica vectorial)
    df = _fetch_and_calculate_vectors(lat, lon, start_date, end_date)
    
    # 3. Obtener preferencia del usuario
    user_settings, _ = IrrigationSettings.objects.get_or_create(user=user)
    pref_method = user_settings.preferred_eto_method # Ej: 'PENMAN'
    
    count_synced = 0
    count_skipped = 0

    # 4. Guardado Eficiente
    for date_idx, row in df.iterrows():
        if pd.isna(row['temp_max']) or pd.isna(row['radiation']):
            continue

        date_obj = date_idx.date()
        
        # A. Respetar datos MANUALES (Regla de Oro)
        existing = DailyWeather.objects.filter(user=user, date=date_obj).first()
        if existing and existing.source == 'MANUAL':
            count_skipped += 1
            continue

        # B. Extraer valor calculado según preferencia
        try:
            val = row.get(pref_method)
            
            # Fallback inteligente: Si la fórmula preferida dio 0/Error, intentamos Penman
            if (pd.isna(val) or val == 0) and row.get('PENMAN', 0) > 0:
                val = row.get('PENMAN')
                method_to_save = 'PENMAN' # Avisamos que usamos fallback
            else:
                method_to_save = pref_method
            
            final_eto = round(float(val), 2) if val else 0.0
        except:
            final_eto = 0.0
            method_to_save = pref_method

        # C. Upsert en BD
        try:
            DailyWeather.objects.update_or_create(
                user=user,
                date=date_obj,
                defaults={
                    'latitude': lat,
                    'longitude': lon,
                    'temp_max': row.get('temp_max'),
                    'temp_min': row.get('temp_min'),
                    'solar_rad': row.get('radiation'),
                    'humidity_mean': row.get('humidity'),
                    'wind_speed': row.get('wind_speed'),
                    # Aquí guardamos el valor real calculado y el método usado
                    'eto_mm': final_eto,
                    'method': method_to_save, 
                    'source': 'NASA_HISTORIC'
                }
            )
            count_synced += 1
        except Exception as e:
            print(f"❌ Error guardando {date_obj}: {e}")

    result_summary = {
        "synced": count_synced,
        "skipped": count_skipped,
        "method_used": pref_method
    }
    
    print(f"✅ Sincronización completada: {result_summary}")
    return result_summary

# =============================================================================
#  3. SERVICIO SINGLE DAY (Operación Diaria puntual)
# =============================================================================

def get_hybrid_weather(user, target_date, lat, lon, force_method=None):
    # 1. BD Local
    existing_record = DailyWeather.objects.filter(user=user, date=target_date).first()
    if existing_record:
        # Si existe pero tiene ETo en 0 (posible error previo), no retornamos, dejamos que recalcule
        if existing_record.eto_mm == 0 and existing_record.temp_max:
             pass 
        else:
             return existing_record

    # 2. Configuración
    if force_method:
        method = force_method 
    else:
        user_settings, _ = IrrigationSettings.objects.get_or_create(user=user)
        method = user_settings.preferred_eto_method

    print(f"📡 NASA: Consultando día {target_date}...")
    
    try:
        # 3. Llamada a NASA API
        nasa_api = NASAPowerAPI()
        # Pedimos un buffer pequeño para asegurar zona horaria
        raw_data = nasa_api.get_daily_data(lat, lon, target_date, target_date)
        
        target_str = target_date.strftime("%Y-%m-%d")
        day_data = raw_data.get(target_str)

        if not day_data:
            print(f"⚠️ NASA no tiene datos para {target_str} (Posible Lag).")
            raise ObjectDoesNotExist(f"Datos satelitales aún no disponibles para {target_str}. Por favor ingrese los datos manualmente o espere 24h.")

        t_max = day_data.get('temp_max')
        t_min = day_data.get('temp_min')
        rad = day_data.get('radiation')
        rh = day_data.get('humidity')
        ws = day_data.get('wind_speed')

        day_of_year = target_date.timetuple().tm_yday
        t_avg = day_data.get('temp_avg')
        eto_val = 0.0

        # 4. Cálculo de ETo puntual
        try:
            if method == 'PENMAN':
                if all(x is not None for x in [t_max, t_min, rh, ws, rad]):
                    eto_val = ETOFormulas.penman_monteith(t_max, t_min, rh, ws, lat, day_of_year, 0, solar_radiation=rad)
                else: raise ValueError("Faltan datos para Penman")
            elif method == 'TURC' and rad and rh:
                eto_val = ETOFormulas.turc(t_avg, rh, rad)
            elif method == 'MAKKINK' and rad:
                eto_val = ETOFormulas.makkink(t_avg, rad)
            elif method == 'CHRISTIANSEN' and all(x is not None for x in [t_max, t_min, rh, ws, rad]):
                eto_val = ETOFormulas.christiansen(t_max, t_min, rh, ws, rad, lat, day_of_year)
            elif method == 'IVANOV' and rh:
                eto_val = ETOFormulas.ivanov(t_avg, rh)
            elif method == 'HARGREAVES':
                eto_val = ETOFormulas.hargreaves(t_max, t_min, t_avg, lat, day_of_year)
            else: 
                eto_val = ETOFormulas.hargreaves(t_max, t_min, t_avg, lat, day_of_year)

        except Exception as calc_error:
            print(f"⚠️ Error en cálculo {method}: {calc_error}. Usando Hargreaves.")
            eto_val = ETOFormulas.hargreaves(t_max, t_min, t_avg, lat, day_of_year)

        # 5. Guardar
        new_record, created = DailyWeather.objects.update_or_create(
            user=user,
            date=target_date,
            defaults={
                'latitude': lat, 'longitude': lon,
                'temp_max': t_max, 'temp_min': t_min,
                'solar_rad': rad,
                'humidity_mean': rh,
                'wind_speed': ws,
                'eto_mm': round(eto_val, 2),
                'source': 'NASA',
                'method': method # Guardamos qué método se usó
            }
        )
        return new_record

    except ObjectDoesNotExist as e:
        raise e
    except Exception as e:
        logger.error(f"Error crítico en get_hybrid_weather: {e}")
        raise Exception(f"No se pudieron obtener datos satelitales: {str(e)}")

# =============================================================================
#  4. UTILS
# =============================================================================

def get_weather_strictly_local(user, target_date):
    record = DailyWeather.objects.filter(user=user, date=target_date).first()
    if not record:
        raise ObjectDoesNotExist(f"No existe registro climático para el {target_date}.")
    return record

def preview_eto_manual(data):
    method = data.get('method', 'PENMAN') 
    def get_float(key, default=None):
        val = data.get(key)
        try: return float(val) if val is not None and val != '' else default
        except: return default

    lat = get_float('latitude', 2.92)
    elevation = get_float('elevation', 0)
    t_max = get_float('temp_max')
    t_min = get_float('temp_min')
    
    t_avg = get_float('temp_mean')
    if t_avg is None and t_max is not None and t_min is not None:
        t_avg = (t_max + t_min) / 2

    rh = get_float('humidity')
    wind = get_float('wind_speed')
    solar = get_float('solar_rad')

    date_str = data.get('date')
    day_of_year = 1
    if date_str:
        try:
            clean_date = date_str.replace('/', '-')
            if len(clean_date.split('-')[0]) == 4: dt = datetime.strptime(clean_date, '%Y-%m-%d')
            else: dt = datetime.strptime(clean_date, '%d-%m-%Y')
            day_of_year = dt.timetuple().tm_yday
        except: pass

    try:
        if method == 'PENMAN': return ETOFormulas.penman_monteith(t_max, t_min, rh, wind, lat, day_of_year, elevation, solar_radiation=solar)
        elif method == 'CHRISTIANSEN': return ETOFormulas.christiansen(t_max, t_min, rh, wind, solar, lat, day_of_year, elevation)
        elif method == 'HARGREAVES': return ETOFormulas.hargreaves(t_max, t_min, t_avg, lat, day_of_year)
        elif method == 'MAKKINK': return ETOFormulas.makkink(t_avg, solar, elevation)
        elif method == 'MAKKINK_ABSTEW': return ETOFormulas.makkink_abstew(t_avg, solar, elevation)
        elif method == 'PRIESTLEY': return ETOFormulas.priestley_taylor(t_avg, solar, elevation)
        elif method == 'SIMPLE_ABSTEW': return ETOFormulas.simple_abstew(t_max, t_min, solar)
        elif method == 'TURC': return ETOFormulas.turc(t_avg, rh, solar)
        elif method == 'IVANOV': return ETOFormulas.ivanov(t_avg, rh)
        else: raise ValueError(f"Método '{method}' no soportado.")
    except Exception as e:
        raise ValueError(f"Error en cálculo manual: {str(e)}")