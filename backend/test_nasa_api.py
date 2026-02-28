import requests
from datetime import datetime, date

BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

params = {
    'parameters': 'T2M_MAX,T2M_MIN,T2M,RH2M,ALLSKY_SFC_SW_DWN,WS2M,PS',
    'community': 'AG',
    'longitude': -74.0,
    'latitude': 4.6, # Bogota (high altitude ~2600m)
    'start': '20230101',
    'end': '20230101',
    'format': 'JSON'
}

response = requests.get(BASE_URL, params=params)
data = response.json()

print("Elevation from geometry:", data.get('geometry', {}).get('coordinates', []))
print("Elevation from properties:", data.get('properties', {}).get('parameter', {}).get('ELEVATION', 'Not there'))
if 'geometry' in data and 'coordinates' in data['geometry']:
    print("Extracted elevation:", data['geometry']['coordinates'][2])
