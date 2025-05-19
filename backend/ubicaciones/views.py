from django.shortcuts import render
from .serializers import UbicacionSerializer, SueloSerializer, PrecipitacionSerializer, EtoSerializer, EtoCalculationSerializer, NasaPowerRequestSerializer
from .models import Ubicacion, Suelo, Precipitacion, Eto
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .services import NasaPowerService
import logging

logger = logging.getLogger(__name__)

class UbicacionAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo ubicacions.
    """
    def get(self, request):
        ubicaciones = Ubicacion.objects.all()
        serializer = UbicacionSerializer(ubicaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UbicacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class UbicacionDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo ubicacions.
    """
    def get(self, request, pk):
        try:
            ubicacion = Ubicacion.objects.get(pk=pk)
        except Ubicacion.DoesNotExist:
            return Response({"error": "Ubication not found"}, status=404)

        serializer = UbicacionSerializer(ubicacion)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            ubicacion = Ubicacion.objects.get(pk=pk)
        except Ubicacion.DoesNotExist:
            return Response({"error": "Ubication not found"}, status=404)

        serializer = UbicacionSerializer(ubicacion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            ubicacion = Ubicacion.objects.get(pk=pk)
        except Ubicacion.DoesNotExist:
            return Response({"error": "ubication not found"}, status=404)

        ubicacion.delete()
        return Response(status=204)

class SueloAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo Suelo.
    """
    def get(self, request):
        soil = Suelo.objects.all()
        serializer = SueloSerializer(soil, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SueloSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class SueloDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo Suelo.
    """
    def get(self, request, pk):
        try:
            soil = Suelo.objects.get(pk=pk)
        except Suelo.DoesNotExist:
            return Response({"error": "Soil not found"}, status=404)

        serializer = SueloSerializer(soil)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            soil = Suelo.objects.get(pk=pk)
        except Suelo.DoesNotExist:
            return Response({"error": "Soil not found"}, status=404)

        serializer = SueloSerializer(soil, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            soil = Suelo.objects.get(pk=pk)
        except Suelo.DoesNotExist:
            return Response({"error": "Soil not found"}, status=404)

        soil.delete()
        return Response(status=204)

class PrecipitacionAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo Precipitacion.
    """
    def get(self, request):
        precipitaciones = Precipitacion.objects.all()
        serializer = PrecipitacionSerializer(precipitaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PrecipitacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class PrecipitacionDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo Precipitacion.
    """
    def get(self, request, pk):
        try:
            precipitacion = Precipitacion.objects.get(pk=pk)
        except Precipitacion.DoesNotExist:
            return Response({"error": "Precipitation not found"}, status=404)

        serializer = PrecipitacionSerializer(precipitacion)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            precipitacion = Precipitacion.objects.get(pk=pk)
        except Precipitacion.DoesNotExist:
            return Response({"error": "Precipitation not found"}, status=404)

        serializer = PrecipitacionSerializer(precipitacion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            precipitacion = Precipitacion.objects.get(pk=pk)
        except Precipitacion.DoesNotExist:
            return Response({"error": "Precipitation not found"}, status=404)

        precipitacion.delete()
        return Response(status=204)

class EtoAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo Eto.
    """
    def get(self, request):
        eto = Eto.objects.all()
        serializer = EtoSerializer(eto, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EtoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class EtoDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo Eto.
    """
    def get(self, request, pk):
        try:
            eto = Eto.objects.get(pk=pk)
        except Eto.DoesNotExist:
            return Response({"error": "Eto not found"}, status=404)

        serializer = EtoSerializer(eto)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            eto = Eto.objects.get(pk=pk)
        except Eto.DoesNotExist:
            return Response({"error": "Eto not found"}, status=404)

        serializer = EtoSerializer(eto, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            eto = Eto.objects.get(pk=pk)
        except Eto.DoesNotExist:
            return Response({"error": "Eto not found"}, status=404)

        eto.delete()
        return Response(status=204)
    
class EtoCalculationAPIView(APIView):
    "api para calculo de evapotranspiracion ETO usando datos de nasa power"

    def post(self, request):
        """""
        Calcula ETO para un rango de fechas y ubicacion especifica
        
        Parametros requeridos:
        - id:ubicacion: ID de ubicacion registrada
        - start_date: Fecha inicio (YYYY-MM-DD)"
        - end_date: Fecha fin (YYYY-MM-DD)
        """
        serializer = EtoCalculationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        ubicacion = data["id_ubicacion"]

        try:
            service = NasaPowerService()

            if not all ([ubicacion.latitud, ubicacion.longitud]):
                raise ValueError("Ubicacion no tiene coordenadas definidas")
            
            eto_objects = service.calcular_eto(
                ubicacion=ubicacion,
                start_date=data["start_date"],
                end_date=data["end_date"]
            )

            serializer = EtoSerializer(eto_objects, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class EtoListView(APIView):
    def get(self, request, ubicacion_id=None):
        queryset = Eto.objects.all()
        if ubicacion_id:
            queryset = queryset.filter(id_ubicacion=ubicacion_id)

        serializer = EtoSerializer(queryset.order_by("-fecha"), many=True)
        return Response(serializer.data)

class NasaPowerAPIView(APIView):
    """
    Esta clase maneja la solicitud a la API de NASA Power para obtener datos climáticos.
    """
    def post(self, request):
        serializer = NasaPowerRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data

        try:
            service = NasaPowerService()
            weather_data = service.get_weather_data(
                latitude=data["latitud"],
                longitude=data["longitud"],
                start_date=data["start_date"],
                end_date=data["end_date"],
            )

            processed_data = self._process_weather_data(weather_data)

            return Response({
                "status": "success",
                "data": processed_data,
                "metadata": {
                    "latitud": data["latitud"],
                    "longitud": data["longitud"],
                    "date_range": {
                        "start": data["start_date"].strftime("%Y-%m-%d"),
                        "end": data["end_date"].strftime("%Y-%m-%d")
                    }
                }
            })
        
        except Exception as e:
            logger.error(f"Error al obtener datos de la API de NASA Power: {str(e)}", exc_info=True)
            return Response(
                {"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    def _process_weather_data(self, raw_data):
        """
        Procesa los datos crudos de la API para un formato mas amigable
        """
        parameters = raw_data.get("properties", {}).get("parameter", {})
        processed = {}

        for param, values in parameters.items():
            processed[param] = {
                "unit": self._get_parameter_unit(param),
                "values": [
                    {"date": date.strftime("%Y-%m-%d"), "value": value}
                    for date, value in values.items()
                ]
            }
            
        return processed

    def _get_parameter_unit(self, parameter):
        """
        Devuelve las unidades para cada parametro
        """
        units = {
            "T2M_MAX": "°C",
            "T2M_MIN": "°C",
            "RH2M": "%",
            "WS2M": "m/s",
            "ALLSKY_SFC_SW_DWN": "W/m²",
            "PRECTOTCORR": "mm"
        }
        return units.get(parameter, "unknown")

