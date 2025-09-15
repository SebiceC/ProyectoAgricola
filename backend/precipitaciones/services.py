import ee
import datetime
from .models import PrecipitationRecord
from datetime import timedelta

# Se recomienda autoinicializar fuera de la función (pero solo una vez al levantar el servicio)
try:
    ee.Initialize(project='etflow')
except Exception:
    try:
        ee.Authenticate()
        ee.Initialize(project='etflow')
    except Exception:
        pass

def obtener_precipitacion_chirps(lat, lon, year, month):
    # Definir las fechas de inicio y fin del mes
    start_date = datetime.date(year, month, 1)
    if month == 12:
        end_date = datetime.date(year + 1, 1, 1)
    else:
        end_date = datetime.date(year, month + 1, 1)
    # Definir el punto de interés
    point = ee.Geometry.Point([float(lon), float(lat)])
    # Filtrar la colección CHIRPS para las fechas indicadas
    dataset = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY').filter(
        ee.Filter.date(str(start_date), str(end_date))
    )
    # Sumar la precipitación diaria para obtener el total mensual
    total_precip_img = dataset.select('precipitation').sum()
    # Extraer el valor para el punto dado
    total_precip = total_precip_img.reduceRegion(
        reducer=ee.Reducer.first(), geometry=point, scale=5000
    ).get('precipitation').getInfo()
    return total_precip



def calcular_precipitacion_efectiva(p):
    if p is None:
        return None
    if p <= 250:
        pef = (p * (125 - 0.2 * 3 * p)) / 125
    else:
        pef = 125 / 3 + 0.1 * p
    return max(pef, 0)

def actualizar_precipitacion(estacion, year, month):
    p = obtener_precipitacion_chirps(estacion.latitude, estacion.longitude, year, month)
    if p is None:
        return None
    pef = calcular_precipitacion_efectiva(p)
    obj, created = PrecipitationRecord.objects.update_or_create(
        station=estacion,
        year=year,
        month=month,
        defaults={
            'precipitation': p,
            'effective_precipitation': pef,
        }
    )
    return obj

def guardar_precipitacion_diaria(station, fecha, precip_mm, pef_mm):
    # Encuentra el año y el mes/día
    year = fecha.year
    month = fecha.month
    day = fecha.day
    # Guardar registro con día extra
    obj, created = PrecipitationRecord.objects.update_or_create(
        station=station,
        year=year,
        month=month,
        defaults={
            'precipitation': precip_mm,
            'effective_precipitation': pef_mm
        }
    )
    return obj


def obtener_y_guardar_precipitacion_diaria_rango(station, lat, lon, start_date, end_date):
    point = ee.Geometry.Point([float(lon), float(lat)])
    dataset = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY').filter(
        ee.Filter.date(str(start_date), str(end_date + timedelta(days=1)))
    )
    imagenes = dataset.toList(dataset.size())
    resultados = []
    for i in range(imagenes.size().getInfo()):
        imagen = ee.Image(imagenes.get(i))
        fecha_ee = ee.Date(imagen.get('system:time_start'))
        fecha = fecha_ee.format('YYYY-MM-dd').getInfo()
        valor = imagen.reduceRegion(
            reducer=ee.Reducer.first(), geometry=point, scale=5000
        ).get('precipitation').getInfo()
        if valor is not None:
            pef = calcular_precipitacion_efectiva(valor)
            # Guardar en DB
            guardar_precipitacion_diaria(station, datetime.date.fromisoformat(fecha), valor, pef)
        else:
            pef = None
        resultados.append({'date': fecha, 'precipitation': valor, 'effective_precipitation': pef})
    return resultados