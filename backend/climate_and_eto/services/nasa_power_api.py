import requests
from datetime import datetime, date
from typing import Dict, List, Optional
from django.conf import settings

class NASAPowerAPI:
    BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

    PARAMETERS = [
        'T2M_MAX', 
        'T2M_MIN', 
        'T2M', 
        'RH2M', 
        'ALLSKY_SFC_SW_DWN', 
        'WS2M',
        'PS',
    ]

    def get_daily_data(self, latitude: float, longitude: float, start_date: date, end_date: date) -> Dict:
        """Obitene datos diarios de NASA POWER"""

        params = {
            'parameters': ','.join(self.PARAMETERS),
            'community': 'AG',
            'longitude': longitude,
            'latitude': latitude,
            'start': start_date.strftime('%Y%m%d'),
            'end': end_date.strftime('%Y%m%d'),
            'format': 'JSON'
        }

        response = requests.get(self.BASE_URL, params=params)
        response.raise_for_status()

        return self._process_nasa_response(response.json())
    
    def _process_nasa_response(self, data: Dict) -> Dict:
        """Convierte la respuesta de NASA POWER a formato del modelo"""

        parameters = data['properties']['parameter']
        processed_data = {}

        #Obtener las fechas disponibles del primer parametro
        first_param = list(parameters.keys())[0]
        dates = parameters[first_param].keys()

        for date_str in dates:
            #Convertir formato NASA (YYYYMMDD) a nuestro formato
            formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"

            day_data = {
                'temp_max': parameters.get('T2M_MAX', {}).get(date_str),
                'temp_min': parameters.get('T2M_MIN', {}).get(date_str),
                'temp_avg': parameters.get('T2M', {}).get(date_str),
                'humidity': parameters.get('RH2M', {}).get(date_str),
                'radiation': parameters.get('ALLSKY_SFC_SW_DWN', {}).get(date_str),
                'wind_speed': parameters.get('WS2M', {}).get(date_str),
                'pressure': parameters.get('PS', {}).get(date_str),
            }

            # validar que no haya valores None
            if all(value is not None for value in day_data.values()):
                processed_data[formatted_date] = day_data
            else:
                print(f"[NASA API] Datos incompletos para {formatted_date}: {day_data}")

        return processed_data