from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Station, PrecipitationRecord
from .serializers import (
    StationSerializer,
    PrecipitationRecordSerializer,
    CargarPrecipitacionInputSerializer,
    PrecipitacionDiariaRangoInputSerializer
)
from .services import actualizar_precipitacion, obtener_y_guardar_precipitacion_diaria_rango 

class StationListCreateView(generics.ListCreateAPIView):
    serializer_class = StationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Station.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class StationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Station.objects.filter(user=self.request.user)

class CargarPrecipitacionesAnioView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CargarPrecipitacionInputSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Confirmar estación válida y del usuario
        try:
            estacion = Station.objects.get(id=data['station_id'], user=request.user)
        except Station.DoesNotExist:
            return Response({"error": "Estación no encontrada o no autorizada"}, status=status.HTTP_404_NOT_FOUND)

        registros = []
        for month in range(1, 13):
            registro = actualizar_precipitacion(estacion, data['year'], month)
            if registro:
                registros.append(registro)
        serializer = PrecipitationRecordSerializer(registros, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PrecipitationRecordYearListView(APIView):
    serializer_class = PrecipitationRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        station_id = request.query_params.get('station_id')
        year = request.query_params.get('year')
        if not station_id or not year:
            return Response({"error": "Parámetros 'station_id' y 'year' requeridos"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            estacion = Station.objects.get(id=station_id, user=request.user)
        except Station.DoesNotExist:
            return Response({"error": "Estación no encontrada o no autorizada"}, status=status.HTTP_404_NOT_FOUND)
        registros = PrecipitationRecord.objects.filter(
            station=estacion, year=year
        ).order_by('month')
        serializer = PrecipitationRecordSerializer(registros, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PrecipitacionDiariaRangoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PrecipitacionDiariaRangoInputSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            estacion = Station.objects.get(id=data['station_id'], user=request.user)
        except Station.DoesNotExist:
            return Response({"error": "Estación no encontrada o no autorizada"}, status=status.HTTP_404_NOT_FOUND)
        resultados = obtener_y_guardar_precipitacion_diaria_rango(
            estacion, estacion.latitude, estacion.longitude,
            data['start_date'], data['end_date']
        )
        return Response(resultados, status=status.HTTP_200_OK)