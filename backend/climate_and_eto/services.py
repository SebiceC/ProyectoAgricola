import requests
from datetime import datetime, timedelta
import math
from django.core.cache import cache
from .models import Ubicacion, Eto
from django.utils import timezone


class NasaPowerService:
    BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
    PARAMETROS = "T2M_MAX,T2M_MIN,RH2M,WS2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR"

    def obtener_datos_climaticos(self, lat, lon, start_date, end_date):
        cache_key = f"nasa_power_{lat}_{lon}_{start_date}_{end_date}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data

        params = {
            "parameters": self.PARAMETROS,
            "community": "AG",
            "longitude": lon,
            "latitude": lat,
            "start": start_date.strftime("%Y%m%d"),
            "end": end_date.strftime("%Y%m%d"),
            "format": "JSON",
        }

        try:
            response = requests.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            cache.set(cache_key, data, 86400)
            return data
        except requests.RequestException as e:
            raise Exception(f"Error al obtener datos de la API de NASA Power: {str(e)}")

    def calcular_eto(self, ubicacion, start_date=None, end_date=None):
        if not start_date:
            start_date = timezone.now().date()
        if not end_date:
            end_date = start_date

        if start_date > end_date:
            raise ValueError(
                "La fecha de inicio no puede ser mayor que la fecha de fin."
            )
        if end_date > start_date:
            raise ValueError("La fecha de fin no puede ser mayor que la fecha actual.")

        api_data = self.obtener_datos_climaticos(
            ubicacion.latitud, ubicacion.longitud, start_date, end_date
        )

        results = []
        current_date = start_date
        while current_date <= end_date:
            try:
                daily_data = self.extraer_datos_diarios(api_data, current_date)
                eto_value = self.computar_eto(
                    t_min=daily_data["T2M_MIN"],
                    t_max=daily_data["T2M_MAX"],
                    radiation=daily_data["ALLSKY_SFC_SW_DWN"],
                    humidity=daily_data["RH2M"],
                    wind_speed=daily_data["WS2M"],
                    precipitation=daily_data["PRECTOTCORR"],
                    elevation=ubicacion.altitud,
                )

                eto_obj, created = Eto.objects.update_or_create(
                    id_ubicacion=ubicacion,
                    fecha=current_date,
                    defaults={
                        "temperatura_maxima": daily_data["T2M_MAX"],
                        "temperatura_minima": daily_data["T2M_MIN"],
                        "humedad_relativa": daily_data["RH2M"],
                        "velocidad_viento": daily_data["WS2M"],
                        "horas_insolacion": daily_data["ALLSKY_SFC_SW_DWN"],
                        "precipitacion": daily_data["PRECTOTCORR"],
                        "evapotranspiracion_potencial": eto_value,
                    },
                )
                results.append(eto_obj)

            except Exception as e:
                raise Exception(f"Error al calcular ETo: {current_date}: {str(e)}")

            current_date += timedelta(days=1)

        return results

    def extraer_datos_diarios(self, api_data, fecha):
        params = api_data.get("properties", {}).get("parameter", {})
        day = str(fecha.day)

        data = {
            "T2M_MAX": params.get("T2M_MAX", {}).get(day),
            "T2M_MIN": params.get("T2M_MIN", {}).get(day),
            "RH2M": params.get("RH2M", {}).get(day),
            "WS2M": params.get("WS2M", {}).get(day),
            "ALLSKY_SFC_SW_DWN": params.get("ALLSKY_SFC_SW_DWN", {}).get(day),
            "PRECTOTCORR": params.get("PRECTOTCORR", {}).get(day),
        }

        if any(v is None for v in data.values()):
            raise ValueError(f"Datos incompletos para la fecha {fecha}: {data}")

        return data

    def computar_eto(self, t_min, t_max, radiation, humidity, wind_speed, elevation):

        t_mean = (t_min + t_max) / 2

        es_min = 0.6108 * math.exp((17.27 * t_min) / (t_min + 237.3))
        es_max = 0.6108 * math.exp((17.27 * t_max) / (t_max + 237.3))
        es = (es_min + es_max) / 2
        ea = (humidity / 100) * es

        delta = 4098 * es / ((t_mean + 237.3) ** 2)
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
        gamma = 0.000665 * P

        # Radiación neta simplificada
        rn = (1 - 0.23) * radiation  # rns
        rn -= (
            4.903e-9
            * (((t_max + 273.16) ** 4 + (t_min + 273.16) ** 4) / 2)
            * (0.34 - 0.14 * math.sqrt(ea))
            * (1.35 * (radiation / 20) - 0.35)
        )

        # ETO final
        numerator = 0.408 * delta * rn + gamma * (900 / (t_mean + 273)) * wind_speed * (
            es - ea
        )
        denominator = delta + gamma * (1 + 0.34 * wind_speed)
        eto = numerator / denominator

        return max(0, round(eto, 2))

    def radiation_to_sun_hours(self, radiation_mj):
        return round(radiation_mj / 0.0864, 2) if radiation_mj else 0
