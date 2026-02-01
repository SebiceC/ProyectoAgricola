import requests
import math
import logging
from datetime import date, datetime
from django.conf import settings
from .eto_formules import ETOFormulas
from .models import DailyWeather, IrrigationSettings
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)

def calculate_eto_hargreaves(t_max, t_min, lat_deg, day_of_year):
    """
    Fórmula Hargreaves-Samani (1985).
    Robusta para cuando faltan datos de viento/humedad.
    """
    if t_max is None or t_min is None:
        raise ValueError("Datos de temperatura insuficientes para calcular ETo. Se requiere ingreso manual.")
    
    lat_rad = math.radians(lat_deg)
    # Declinación solar
    delta = 0.409 * math.sin(((2 * math.pi / 365) * day_of_year) - 1.39)
    # Ángulo horario de puesta de sol
    ws = math.acos(-math.tan(lat_rad) * math.tan(delta))
    # Distancia relativa Tierra-Sol inversa
    dr = 1 + 0.033 * math.cos((2 * math.pi / 365) * day_of_year)
    
    # Radiación Extraterrestre (Ra)
    ra = (24 * 60 / math.pi) * 0.0820 * dr * (
        (ws * math.sin(lat_rad) * math.sin(delta)) + 
        (math.cos(lat_rad) * math.cos(delta) * math.sin(ws))
    )

    t_mean = (t_max + t_min) / 2
    # Fórmula Final
    eto = 0.0023 * (t_mean + 17.8) * (t_max - t_min)**0.5 * 0.408 * ra
    return max(0, eto)

def get_hybrid_weather(user, target_date, lat, lon, force_method=None):
    """
    MOTOR HÍBRIDO + MULTI-FÓRMULA:
    1. Busca datos manuales.
    2. Si no, baja datos de NASA.
    3. Carga la configuración del usuario (Penman vs Hargreaves vs Turc).
    4. Aplica la fórmula elegida.
    """
    
    # 1. BD Local
    existing_record = DailyWeather.objects.filter(user=user, date=target_date).first()
    if existing_record:
        return existing_record

    # 2. Configuración del Usuario
    if force_method:
        method = force_method # 🟢 Usamos el método que viene del frontend
        print(f"🔧 Usando método forzado por usuario: {method}")
    else:
        user_settings, _ = IrrigationSettings.objects.get_or_create(user=user)
        method = user_settings.preferred_eto_method
        print(f"⚙️ Usando configuración global: {method}")

    # 3. Llamada a NASA API (Pedimos TODO lo necesario para Penman)
    print(f"📡 Solicitando datos NASA ({method}) para {target_date}...")
    try:
        str_date = target_date.strftime("%Y%m%d")
        url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        params = {
            # Temp, Radiación, Humedad, Viento
            "parameters": "T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN,RH2M,WS2M", 
            "community": "AG",
            "longitude": lon,
            "latitude": lat,
            "start": str_date,
            "end": str_date,
            "format": "JSON"
        }
        
        response = requests.get(url, params=params, timeout=8)
        response.raise_for_status()
        data = response.json()
        props = data['properties']['parameter']
        
        # Extracción segura de datos
        t_max = props['T2M_MAX'].get(str_date, -999)
        t_min = props['T2M_MIN'].get(str_date, -999)
        rad = props['ALLSKY_SFC_SW_DWN'].get(str_date, -999)
        rh = props['RH2M'].get(str_date, -999) # Humedad
        ws = props['WS2M'].get(str_date, -999) # Viento

        if t_max == -999: raise ValueError("Datos NASA corruptos")

        # Variables derivadas comunes
        t_avg = (t_max + t_min) / 2
        day_of_year = target_date.timetuple().tm_yday
        eto_val = 0.0

        # 4. SELECCIÓN DE FÓRMULA 🧮

        # Estrategia: Intentar usar el método preferido, si faltan datos, hacer Fallback
        
        try:
            if method == 'PENMAN':
                if rh != -999 and ws != -999 and rad != -999:
                    eto_val = ETOFormulas.penman_monteith(t_max, t_min, rh, ws, rad, lat, day_of_year)
                else: raise ValueError("Faltan datos para Penman")

            elif method == 'TURC':
                if rh != -999 and rad != -999:
                    eto_val = ETOFormulas.turc(t_avg, rh, rad)
                else: raise ValueError("Faltan datos para Turc")

            elif method == 'MAKKINK':
                if rad != -999:
                    eto_val = ETOFormulas.makkink(t_avg, rad)
                else: raise ValueError("Faltan datos para Makkink")
            
            elif method == 'MAKKINK_ABSTEW':
                if rad != -999:
                    eto_val = ETOFormulas.makkink_abstew(t_avg, rad)
                else: raise ValueError("Faltan datos para Makkink-Abstew")

            elif method == 'PRIESTLEY':
                if rad != -999:
                    eto_val = ETOFormulas.priestley_taylor(t_avg, rad)
                else: raise ValueError("Faltan datos para Priestley")

            elif method == 'IVANOV':
                if rh != -999:
                    eto_val = ETOFormulas.ivanov(t_avg, rh)
                else: raise ValueError("Faltan datos para Ivanov")

            elif method == 'CHRISTIANSEN':
                if rh != -999 and ws != -999 and rad != -999:
                    eto_val = ETOFormulas.christiansen(t_max, t_min, rh, ws, rad, lat, day_of_year)
                else: raise ValueError("Faltan datos para Christiansen")

            else: # Default: HARGREAVES
                eto_val = ETOFormulas.hargreaves(t_max, t_min, t_avg, lat, day_of_year)

        except ValueError as ve:
            print(f"⚠️ Fallback activado: {ve}. Usando Hargreaves.")
            # Fallback seguro: Hargreaves solo necesita temperatura
            eto_val = ETOFormulas.hargreaves(t_max, t_min, t_avg, lat, day_of_year)

        # Guardar resultado
        new_record, created = DailyWeather.objects.update_or_create(
            user=user,
            date=target_date,
            defaults={
                'latitude': lat,
                'longitude': lon,
                'temp_max': t_max,
                'temp_min': t_min,
                'solar_rad': rad if rad > -900 else None,
                'humidity_mean': rh if rh > -900 else None,
                'wind_speed': ws if ws > -900 else None,
                'eto_mm': round(eto_val, 2),
                'source': 'NASA'
            }
        )
        return new_record

    except Exception as e:
        print(f"⚠️ Error Crítico Clima: {e}")
        raise Exception(f"No se pudieron obtener datos satelitales (NASA POWER): {str(e)}. Por favor, registre el clima manualmente para esta fecha.")
    

def get_weather_strictly_local(user, target_date):
    """
    Busca datos climáticos SOLO en la base de datos local.
    NO llama a la NASA. Si no existe, lanza error.
    """
    record = DailyWeather.objects.filter(user=user, date=target_date).first()
    
    if not record:
        # Lanzamos una excepción controlada para que la Vista la atrape
        raise ObjectDoesNotExist(
            f"No existe registro climático para el {target_date}. "
            "Por favor vaya al módulo 'Clima / ETo' y genere el dato (Manual o vía Satélite) antes de calcular el riego."
        )
    
    return record

def preview_eto_manual(data):
    """
    Ruteador de Estrategia: Recibe datos crudos y selecciona la fórmula matemática.
    """
    method = data.get('method', 'PENMAN') 
    
    # 1. Preparación de Datos Comunes
    def get_float(key, default=None):
        val = data.get(key)
        return float(val) if val is not None and val != '' else default

    lat = get_float('latitude', 2.92)
    elevation = get_float('elevation', 0)
    
    t_max = get_float('temp_max')
    t_min = get_float('temp_min')
    
    # Calculamos Temp Promedio si no viene
    t_avg = get_float('temp_mean')
    if t_avg is None and t_max is not None and t_min is not None:
        t_avg = (t_max + t_min) / 2

    # Variables Específicas
    rh = get_float('humidity')
    wind = get_float('wind_speed')
    solar = get_float('solar_rad')

    # Calcular Día del Año (J)
    date_str = data.get('date')
    day_of_year = 1
    if date_str:
        try:
            # Soporte dual de formatos
            clean_date = date_str.replace('/', '-')
            if len(clean_date.split('-')[0]) == 4:
                dt = datetime.strptime(clean_date, '%Y-%m-%d')
            else:
                dt = datetime.strptime(clean_date, '%d-%m-%Y')
            day_of_year = dt.timetuple().tm_yday
        except:
            pass

    # 2. Selección de Fórmula (Strategy Pattern)
    try:
        # --- GRUPO PENMAN (Completo) ---
        if method == 'PENMAN':
            if None in [t_max, t_min, rh, wind, solar]:
                raise ValueError("Penman-Monteith requiere T.Max, T.Min, Humedad, Viento y Radiación.")
            return ETOFormulas.penman_monteith(t_max, t_min, rh, wind, solar, lat, day_of_year, elevation)

        elif method == 'CHRISTIANSEN':
             if None in [t_max, t_min, rh, wind, solar]:
                 raise ValueError("Christiansen requiere todos los parámetros climáticos.")
             return ETOFormulas.christiansen(t_max, t_min, rh, wind, solar, lat, day_of_year, elevation)

        # --- GRUPO TEMPERATURA ---
        elif method == 'HARGREAVES':
            if None in [t_max, t_min]:
                raise ValueError("Hargreaves requiere Temperaturas Máxima y Mínima.")
            return ETOFormulas.hargreaves(t_max, t_min, t_avg, lat, day_of_year)

        # --- GRUPO RADIACIÓN ---
        elif method == 'MAKKINK':
            if None in [t_avg, solar]:
                 raise ValueError("Makkink requiere Temp. Media y Radiación.")
            return ETOFormulas.makkink(t_avg, solar, elevation)
            
        elif method == 'MAKKINK_ABSTEW':
            if None in [t_avg, solar]:
                 raise ValueError("Makkink-Abstew requiere Temp. Media y Radiación.")
            return ETOFormulas.makkink_abstew(t_avg, solar, elevation)

        elif method == 'PRIESTLEY':
            if None in [t_avg, solar]:
                 raise ValueError("Priestley-Taylor requiere Temp. Media y Radiación.")
            return ETOFormulas.priestley_taylor(t_avg, solar, elevation)

        elif method == 'SIMPLE_ABSTEW': # 🟢 AGREGADO
             if None in [t_max, t_min, solar]:
                 raise ValueError("Simple Abstew requiere Temperaturas y Radiación.")
             return ETOFormulas.simple_abstew(t_max, t_min, solar)

        # --- GRUPO HUMEDAD ---
        elif method == 'TURC':
            if None in [t_avg, rh, solar]:
                raise ValueError("Turc requiere Temp. Media, Humedad y Radiación.")
            return ETOFormulas.turc(t_avg, rh, solar)
            
        elif method == 'IVANOV': # 🟢 AGREGADO
             if None in [t_avg, rh]:
                 raise ValueError("Ivanov requiere Temp. Media y Humedad.")
             return ETOFormulas.ivanov(t_avg, rh)
        
        else:
            raise ValueError(f"Método '{method}' no soportado aún en cálculo manual.")

    except Exception as e:
        raise ValueError(f"Error en cálculo: {str(e)}")