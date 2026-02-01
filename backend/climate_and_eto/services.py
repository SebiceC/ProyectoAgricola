import requests
import math
from datetime import date
from django.conf import settings

from .eto_formules import ETOFormulas
from .models import DailyWeather, IrrigationSettings


def calculate_eto_hargreaves(t_max, t_min, lat_deg, day_of_year):
    """
    Fórmula Hargreaves-Samani (1985).
    Robusta para cuando faltan datos de viento/humedad.
    """
    if t_max is None or t_min is None: return 5.0
    
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

def get_hybrid_weather(user, target_date, lat, lon):
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
    user_settings, _ = IrrigationSettings.objects.get_or_create(user=user)
    method = user_settings.preferred_eto_method # Ej: 'PENMAN', 'HARGREAVES'

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
        return DailyWeather(
            date=target_date, 
            eto_mm=5.0, 
            source='ERROR',
            latitude=lat,
            longitude=lon
        )