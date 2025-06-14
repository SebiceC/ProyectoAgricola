import math
import requests
from .models import Ubicacion, Suelo, Precipitacion, Eto
from rest_framework import viewsets, permissions, status
from .serializers import UbicacionSerializer, SueloSerializer, PrecipitacionSerializer, EtoSerializer
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action

class UbicacionViewSet(viewsets.ModelViewSet):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo ubicacions.
    """
    queryset = Ubicacion.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UbicacionSerializer

class SueloViewSet(viewsets.ModelViewSet):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo Suelo.
    """
    queryset = Suelo.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = SueloSerializer

class PrecipitacionViewSet(viewsets.ModelViewSet):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo Precipitacion.
    """
    queryset = Precipitacion.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = PrecipitacionSerializer

class EtoViewSet(viewsets.ModelViewSet):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo Eto.
    """
    queryset = Eto.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = EtoSerializer

# views.py
class EvapotranspirationViewSet(viewsets.ViewSet):
    """
    ViewSet para manejar la obtención de datos de evapotranspiración.
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def get_evapotranspiration(self, request):
        """
        Obtiene datos de evapotranspiración desde PowerLARC.
        """
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        start_date = request.query_params.get('start', '20250501')
        end_date = request.query_params.get('end', '20250530')
        
        if not lat or not lon:
            return Response({
                'status': 'error',
                'message': 'Parámetros lat y lon son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    
        params = {
            'parameters': 'T2M_MAX,T2M_MIN,RH2M,WS2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR,ALLSKY_SRF_ALB,CLRSKY_SFC_SW_DWN,EVLAND',
            'community': 'AG',
            'latitude': lat,
            'longitude': lon,
            'start': start_date,
            'end': end_date,
            'format': 'JSON'
        }

        # Llamada a la API de PowerLARC

        try:
            response = requests.get(
                'https://power.larc.nasa.gov/api/temporal/daily/point',
                params=params
            )
        
            response.raise_for_status()
            data = response.json()

            parameters = data.get('properties', {}).get('parameter', {})

            evapotranspiration = data.get('properties', {}).get('parameter', {}).get('EVLAND', {})

            weather_data = {
                'T2M_MAX': parameters.get('T2M_MAX', []),
                'T2M_MIN': parameters.get('T2M_MIN', []),
                'RH2M': parameters.get('RH2M', []),
                'WS2M': parameters.get('WS2M', []),
                'ALLSKY_SFC_SW_DWN': parameters.get('ALLSKY_SFC_SW_DWN', []),
                'PRECTOTCORR': parameters.get('PRECTOTCORR', []),
                'ALLSKY_SRF_ALB': parameters.get('ALLSKY_SRF_ALB', []),
                'CLRSKY_SFC_SW_DWN': parameters.get('CLRSKY_SFC_SW_DWN', [])
            }

            return Response({
                'status': 'success',
                'evapotranspiration': evapotranspiration,
                'weather_data': weather_data
            }, status=status.HTTP_200_OK)
        
        except requests.exceptions.RequestException as e:
            return Response({
                'status': 'error',
                'message': f'Error al llamar a la API de NASA POWER: {str(e)}',
                'debug': f'URL solicitada: {response.url}' 
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=["post"])
    def calculate_eto_manual(self, request):
        try:
            tmax = float(request.data.get("tmax"))
            tmin = float(request.data.get("tmin"))
            rh_mean = float(request.data.get("rh_mean"))
            wind_2m = float(request.data.get("wind_2m"))
            rn = float(request.data.get("rn"))
            altitude = float(request.data.get("altitude"))

            eto = self._calculate_penman_monteith(
                tmax, tmin, rh_mean, wind_2m, rn, altitude
            )

            return Response({"eto": eto}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _calculate_penman_monteith(self, tmax, tmin, rh_mean, wind_2m, rn, altitude):
        tmean = (tmax + tmin) / 2
        es_tmax = 0.6108 * math.exp((17.27 * tmax) / (tmax + 237.3))
        es_tmin = 0.6108 * math.exp((17.27 * tmin) / (tmin + 237.3))
        es = (es_tmax + es_tmin) / 2
        ea = es * (rh_mean / 100)
        delta = 4098 * (0.6108 * math.exp((17.27 * tmean) / (tmean + 237.3))) / ((tmean + 237.3) ** 2)
        p = 101.3 * (((293 - 0.0065 * altitude) / 293) ** 5.26)
        gamma = 0.000665 * p

        numerator = 0.408 * delta * rn + gamma * (900 / (tmean + 273)) * wind_2m * (es - ea)
        denominator = delta + gamma * (1 + 0.34 * wind_2m)
        eto = numerator / denominator

        return round(eto, 2)