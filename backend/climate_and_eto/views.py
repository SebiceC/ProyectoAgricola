from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime

from .models import DailyWeather, IrrigationSettings
from .serializers import DailyWeatherSerializer, IrrigationSettingsSerializer
from .services import get_hybrid_weather

class DailyWeatherViewSet(viewsets.ModelViewSet):
    serializer_class = DailyWeatherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DailyWeather.objects.filter(user=self.request.user).order_by('-date')

    # 🟢 AGREGAR ESTO: Inyección de Usuario al Crear (POST)
    def perform_create(self, serializer):
        # Al guardar, le decimos: "El dueño de esto es quien hizo la petición"
        serializer.save(user=self.request.user)
        
    @action(detail=False, methods=['get'])
    def fetch_for_date(self, request):
        date_str = request.query_params.get('date')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')

        if not date_str or not lat:
            return Response({"error": "Faltan parámetros date, lat, lon"}, status=400)

        try:
            target_date = datetime.strptime(date_str, "%d-%m-%Y").date()
            weather = get_hybrid_weather(request.user, target_date, float(lat), float(lon))
            serializer = self.get_serializer(weather)
            return Response(serializer.data)
        except ValueError:
             return Response({"error": "Formato de fecha inválido"}, status=400)

class IrrigationSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = IrrigationSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return IrrigationSettings.objects.filter(user=self.request.user)
        
    def get_object(self):
        obj, _ = IrrigationSettings.objects.get_or_create(user=self.request.user)
        return obj

    # 🟢 AGREGAR ESTO: Inyección de Usuario al Crear (POST)
    def perform_create(self, serializer):
        # Al guardar, le decimos: "El dueño de esto es quien hizo la petición"
        serializer.save(user=self.request.user)

    # 🟢 NUEVO ENDPOINT: /api/climate/settings/choices/
    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Devuelve las fórmulas disponibles definidas en el Modelo (Backend).
        Así el Frontend no tiene que 'adivinar' o tenerlas hardcodeadas.
        """
        return Response({
            "eto_methods": [
                {"value": k, "label": v} for k, v in IrrigationSettings.ETO_METHODS
            ],
            "rain_methods": [
                {"value": k, "label": v} for k, v in IrrigationSettings.RAIN_METHODS
            ]
        })