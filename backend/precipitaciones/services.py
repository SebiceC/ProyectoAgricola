import ee
import os
import json
from datetime import datetime
from google.oauth2.service_account import Credentials 
from .models import PrecipitationRecord
from django.core.exceptions import ObjectDoesNotExist

# Ruta al archivo JSON
KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'ee-key.json')

def inicializar_earth_engine():
    """
    Autenticación robusta con Scopes explícitos.
    """
    try:
        ee.Image('UCSB-CHG/CHIRPS/DAILY')
    except:
        try:
            if os.path.exists(KEY_PATH):
                print(f"🔑 Cargando credenciales GEE...")
                SCOPES = ['https://www.googleapis.com/auth/earthengine']
                credentials = Credentials.from_service_account_file(KEY_PATH, scopes=SCOPES)
                ee.Initialize(credentials)
            else:
                print("⚠️ No se encontró ee-key.json")
                ee.Initialize()
        except Exception as e:
            print(f"❌ Error Auth GEE: {e}")
            raise Exception(f"Fallo de Autenticación GEE: {e}")

def obtener_y_guardar_precipitacion_diaria_rango(station, lat, lon, start_date, end_date):
    """
    Descarga datos de CHIRPS (Honesto: Sin modificar fechas).
    """
    # 1. Validación de Datos de Entrada
    print(f"📍 Validando coordenadas para estación '{station.name}': Lat={lat}, Lon={lon}")

    try:
        f_lat = float(lat)
        f_lon = float(lon)
        
        if not (-90 <= f_lat <= 90):
            raise ValueError(f"Latitud inválida ({f_lat}).")
        if not (-180 <= f_lon <= 180):
            raise ValueError(f"Longitud inválida ({f_lon}).")

    except (ValueError, TypeError):
        raise Exception(f"Coordenadas corruptas: Lat: {lat}, Lon: {lon}")

    # 2. Inicializar Conexión
    inicializar_earth_engine()
    
    # 3. Definir Fechas y Geometría
    # Earth Engine usa [LONGITUD, LATITUD]
    punto = ee.Geometry.Point([f_lon, f_lat])
    
    ee_start = start_date.strftime('%Y-%m-%d')
    ee_end = end_date.strftime('%Y-%m-%d')
    
    print(f"🛰️ Consultando CHIRPS ({ee_start} a {ee_end})...")

    # 4. Colección CHIRPS
    chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') \
        .filterDate(ee_start, ee_end) \
        .filterBounds(punto)

    # 5. Reducer
    def extraer_dato(img):
        date = img.date().format('YYYY-MM-dd')
        value = img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=punto,
            scale=5000 
        ).get('precipitation')
        return ee.Feature(None, {'date': date, 'precipitation': value})

    # Ejecutar en Google
    try:
        data = chirps.map(extraer_dato).getInfo()
    except Exception as e:
        raise Exception(f"Error interno GEE: {e}")

    # 6. Guardar en BD
    resultados = []
    registros_creados = 0

    if 'features' in data:
        for feature in data['features']:
            props = feature['properties']
            fecha_str = props.get('date')
            precip_mm = props.get('precipitation')

            if precip_mm is None:
                # Si GEE devuelve nulo, es que no hay dato procesado. Saltamos.
                continue

            if precip_mm < 0:
                precip_mm = 0.0
            
            valor_final = round(float(precip_mm), 2)
            fecha_obj = datetime.strptime(fecha_str, '%Y-%m-%d').date()

            obj, created = PrecipitationRecord.objects.update_or_create(
                station=station,
                date=fecha_obj,
                defaults={
                    'precipitation_mm': valor_final,          
                    'effective_precipitation_mm': valor_final,
                    'source': 'SATELLITE'
                }
            )
            
            resultados.append({
                "date": fecha_str,
                "mm": valor_final
            })
            if created: registros_creados += 1

    print(f"✅ Sincronización finalizada. Registros nuevos: {registros_creados}.")
    return resultados

def get_precipitation_strictly_local(station, target_date):
    """
    Busca datos de precipitación SOLO en la base de datos local.
    """
    record = PrecipitationRecord.objects.filter(station=station, date=target_date).first()
    
    if not record:
        raise ObjectDoesNotExist(
            f"No existe registro de precipitación para el {target_date} en '{station.name}'. "
            "Por favor sincronice o registre el dato manualmente."
        )
    
    
    return record

def get_historical_precipitation_on_the_fly(lat, lon, start_date, end_date):
    """
    MODO LECTURA "AL VUELO": Descarga datos de CHIRPS directamente y promedia
    mensualmente sin guardar en la Base de Datos Histórica.
    """
    print(f"Generando Histórico de Lluvias Al Vuelo ({start_date} a {end_date})")
    
    # 1. Validación de Datos de Entrada
    try:
        f_lat = float(lat)
        f_lon = float(lon)
    except (ValueError, TypeError):
        raise ValueError(f"Coordenadas corruptas: Lat: {lat}, Lon: {lon}")

    # 2. Obtener datos crudos de CHIRPS
    inicializar_earth_engine()
    punto = ee.Geometry.Point([f_lon, f_lat])
    ee_start = start_date.strftime('%Y-%m-%d')
    ee_end = end_date.strftime('%Y-%m-%d')
    
    chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') \
        .filterDate(ee_start, ee_end) \
        .filterBounds(punto)

    def extraer_dato(img):
        date = img.date().format('YYYY-MM-dd')
        value = img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=punto,
            scale=5000 
        ).get('precipitation')
        return ee.Feature(None, {'date': date, 'precipitation': value})

    try:
        data = chirps.map(extraer_dato).getInfo()
    except Exception as e:
        raise Exception(f"Error interno GEE: {e}")

    # Diccionario para agrupar las lluvias diarias en totales mensuales por cada año
    monthly_totals_by_year = {i: {} for i in range(1, 13)}

    if 'features' in data:
        for feature in data['features']:
            props = feature['properties']
            fecha_str = props.get('date')
            precip_mm = props.get('precipitation')

            if precip_mm is None or precip_mm < 0:
                continue
            
            # Parse Date
            try:
                date_obj = datetime.strptime(fecha_str, "%Y-%m-%d").date()
                month_idx = date_obj.month
                year_idx = date_obj.year
                
                if year_idx not in monthly_totals_by_year[month_idx]:
                    monthly_totals_by_year[month_idx][year_idx] = 0.0
                
                monthly_totals_by_year[month_idx][year_idx] += float(precip_mm)
            except:
                continue

    results = []
    meses_nombres = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio",
        7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
    }

    for month_idx in range(1, 13):
        year_totals = monthly_totals_by_year[month_idx]
        num_years = len(year_totals)
        
        # El promedio CROPWAT es la suma de los totales de cada mes dividida 
        # entre el número de años en los que se registró el mes.
        if num_years > 0:
            avg_monthly_mm = sum(year_totals.values()) / num_years
        else:
            avg_monthly_mm = 0.0

        results.append({
            "month": month_idx,
            "month_name": meses_nombres[month_idx],
            "precipitation": round(avg_monthly_mm, 2)
        })

    return results

def get_historical_precipitation(station, start_date, end_date):
    """
    MODO LECTURA LEGACY: Genera datos buscando en BD local (OBSOLETO).
    """
    pass

def sync_historical_to_daily_precip(station, lat, lon, start_date, end_date):
    """
    MODO ESCRITURA: Toma el rango de datos seleccionado de CHIRPS y lo inyecta 
    en la tabla operativa PrecipitationRecords, respetando datos MANUALES.
    """
    print(f"💾 SINCRONIZANDO LLUVIAS A OPERACIÓN DIARIA ({station.name}): {start_date} a {end_date}")
    
    return obtener_y_guardar_precipitacion_diaria_rango(
        station, lat, lon, start_date, end_date
    )
