import ee
import os
import json
from datetime import datetime, timedelta
from google.oauth2.service_account import Credentials 
from .models import PrecipitationRecord

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
    Descarga datos de CHIRPS validando geometría.
    """
    # 1. Validación de Datos de Entrada (DEBUG)
    print(f"📍 Validando coordenadas para estación '{station.name}': Lat={lat}, Lon={lon}")

    try:
        # Convertir a float y validar rangos terrestres
        f_lat = float(lat)
        f_lon = float(lon)
        
        if not (-90 <= f_lat <= 90):
            raise ValueError(f"Latitud inválida ({f_lat}). Debe estar entre -90 y 90.")
        if not (-180 <= f_lon <= 180):
            raise ValueError(f"Longitud inválida ({f_lon}). Debe estar entre -180 y 180.")

    except (ValueError, TypeError):
        raise Exception(f"Coordenadas corruptas en la estación: Lat: {lat}, Lon: {lon}")

    # 2. Inicializar Conexión
    inicializar_earth_engine()
    
    # 3. Definir Fechas y Geometría
    # ⚠️ IMPORTANTE: Earth Engine usa [LONGITUD, LATITUD] (X, Y)
    punto = ee.Geometry.Point([f_lon, f_lat])
    
    ee_start = start_date.strftime('%Y-%m-%d')
    ee_end = end_date.strftime('%Y-%m-%d')
    
    print(f"🛰️ Consultando CHIRPS ({ee_start} a {ee_end})...")

    # 4. Colección CHIRPS
    chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') \
        .filterDate(ee_start, ee_end) \
        .filterBounds(punto)

    # 5. Reducer (Extraer datos)
    def extraer_dato(img):
        date = img.date().format('YYYY-MM-dd')
        value = img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=punto,
            scale=5000 
        ).get('precipitation')
        # Manejo de nulos en la nube
        return ee.Feature(None, {'date': date, 'precipitation': value})

    # Ejecutar en Google
    try:
        data = chirps.map(extraer_dato).getInfo()
    except Exception as e:
        raise Exception(f"Error interno de Earth Engine al procesar geometría: {e}")

    # 6. Guardar en BD
    resultados = []
    registros_creados = 0

    if 'features' in data:
        for feature in data['features']:
            props = feature['properties']
            fecha_str = props['date']
            precip_mm = props['precipitation']

            if precip_mm is None or precip_mm < 0:
                precip_mm = 0.0
            
            valor_final = round(float(precip_mm), 2)
            fecha_obj = datetime.strptime(fecha_str, '%Y-%m-%d').date()

            obj, created = PrecipitationRecord.objects.update_or_create(
                station=station,
                date=fecha_obj,
                defaults={
                    'precipitation_mm': valor_final,          # <--- FALTABA ESTE CAMPO OBLIGATORIO
                    'effective_precipitation_mm': valor_final,
                    'source': 'SATELLITE'
                }
            )
            
            resultados.append({
                "date": fecha_str,
                "mm": round(float(precip_mm), 2)
            })
            if created: registros_creados += 1

    print(f"✅ Sincronización exitosa: {registros_creados} nuevos registros.")
    return resultados