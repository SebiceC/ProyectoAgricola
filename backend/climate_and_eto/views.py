from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime
from .eto_formules import ETOFormulas
from .models import DailyWeather, IrrigationSettings
from .serializers import DailyWeatherSerializer, IrrigationSettingsSerializer
from .services import get_hybrid_weather, preview_eto_manual

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
            # 🟢 CORRECCIÓN: Detección inteligente de formato (ISO vs Latino)
            clean_date = date_str.replace('/', '-')
            
            if len(clean_date.split('-')[0]) == 4:
                # Formato YYYY-MM-DD (2026-02-01)
                target_date = datetime.strptime(clean_date, "%Y-%m-%d").date()
            else:
                # Formato DD-MM-YYYY (01-02-2026)
                target_date = datetime.strptime(clean_date, "%d-%m-%Y").date()

            # Si lat/lon no vienen, usamos defaults (necesario para get_hybrid_weather)
            safe_lat = float(lat) if lat else 2.92
            safe_lon = float(lon) if lon else -75.28

            # Llamamos al servicio
            weather = get_hybrid_weather(request.user, target_date, safe_lat, safe_lon)
            
            serializer = self.get_serializer(weather)
            return Response(serializer.data)
        except ValueError as e:
             return Response({"error": f"Error de formato o valor: {str(e)}"}, status=400)
        except Exception as e:
             # Si no existe y get_hybrid falló (ej. error de conexión NASA en carga inicial)
             # Devolvemos vacío para que el frontend permita edición manual
             print(f"⚠️ Error fetch_for_date: {e}")
             return Response({})
        
    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Calculadora ETo en tiempo real. 
        No guarda en BD, solo retorna el número.
        """
        try:
            # Llamamos al servicio que creamos arriba
            eto_value = preview_eto_manual(request.data)
            return Response({
                "eto": eto_value,
                "method": request.data.get('method'),
                "message": "Cálculo exitoso"
            })
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": "Error interno del servidor"}, status=500)
        
    # 🟢 NUEVA ACCIÓN: Sincronizar NASA con Fórmula Específica
    @action(detail=False, methods=['post'])
    def sync_nasa(self, request):
        """
        Descarga datos de NASA y calcula ETo usando la fórmula que pida el usuario.
        """
        try:
            # Validación de datos numéricos
            lat = float(request.data.get('lat'))
            lon = float(request.data.get('lon'))
            date_str = request.data.get('date')
            method = request.data.get('method')

            # Parseo de fecha robusto
            clean_date = date_str.replace('/', '-')
            if len(clean_date.split('-')[0]) == 4:
                target_date = datetime.strptime(clean_date, "%Y-%m-%d").date()
            else:
                target_date = datetime.strptime(clean_date, "%d-%m-%Y").date()

            # 🟢 CORRECCIÓN: Llamada con todos los argumentos (lat, lon, method)
            # Pasamos 'force_method' para que use la fórmula del selector del frontend
            weather_record = get_hybrid_weather(
                user=request.user, 
                target_date=target_date, 
                lat=lat, 
                lon=lon,
                force_method=method 
            )
            
            # Serializamos el objeto guardado
            serializer = self.get_serializer(weather_record)
            
            # Retornamos datos + info extra útil para el frontend
            return Response({
                **serializer.data,
                'method_used': method,
                'source': 'SATELLITE'
            })

        except ValueError as e:
             return Response({"error": f"Datos inválidos: {str(e)}"}, status=400)
        except Exception as e:
             return Response({"error": f"Error NASA/Cálculo: {str(e)}"}, status=500)

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
        # Generamos la lista de objetos JSON basándonos en el diccionario maestro
        eto_options = [
            {"value": k, "label": v} 
            for k, v in ETOFormulas.METHOD_LABELS.items()
        ]
        
        # RAIN_METHODS sigue en el modelo
        rain_options = [
            {"value": k, "label": v} 
            for k, v in IrrigationSettings.RAIN_METHODS
        ]

        return Response({
            "eto_methods": eto_options,
            "rain_methods": rain_options
        })