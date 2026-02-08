from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime
from .eto_formules import ETOFormulas
from .models import DailyWeather, IrrigationSettings, ClimateStudy
from .serializers import DailyWeatherSerializer, IrrigationSettingsSerializer, ClimateStudySerializer
from .services import get_hybrid_weather, preview_eto_manual, get_historical_climatology

class DailyWeatherViewSet(viewsets.ModelViewSet):
    serializer_class = DailyWeatherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DailyWeather.objects.filter(user=self.request.user).order_by('-date')

    # 🟢 Inyección de Usuario al Crear (POST)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    @action(detail=False, methods=['get'])
    def fetch_for_date(self, request):
        date_str = request.query_params.get('date')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')

        if not date_str:
            return Response({"error": "Falta parámetro date"}, status=400)

        try:
            # 🟢 Detección inteligente de formato (ISO vs Latino)
            clean_date = date_str.replace('/', '-')
            
            if len(clean_date.split('-')[0]) == 4:
                # Formato YYYY-MM-DD (2026-02-01)
                target_date = datetime.strptime(clean_date, "%Y-%m-%d").date()
            else:
                # Formato DD-MM-YYYY (01-02-2026)
                target_date = datetime.strptime(clean_date, "%d-%m-%Y").date()

            # Si lat/lon no vienen, usamos defaults
            safe_lat = float(lat) if lat else 2.92
            safe_lon = float(lon) if lon else -75.28

            # Llamamos al servicio
            weather = get_hybrid_weather(request.user, target_date, safe_lat, safe_lon)
            
            serializer = self.get_serializer(weather)
            return Response(serializer.data)
        except ValueError as e:
             return Response({"error": f"Error de formato o valor: {str(e)}"}, status=400)
        except Exception as e:
             # Si no existe y get_hybrid falló (ej. Lag de NASA), devolvemos vacío para permitir manual
             print(f"⚠️ Error fetch_for_date: {e}")
             return Response({})
        
    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Calculadora ETo en tiempo real. 
        No guarda en BD, solo retorna el número.
        """
        try:
            # Llamamos al servicio de previsualización
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
        
    # 🟢 Sincronizar NASA con Fórmula Específica
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

            # Llamada al servicio con force_method
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
    
    @action(detail=False, methods=['get'])
    def historical_analysis(self, request):
        """
        Endpoint para análisis de datos históricos y comparativa de fórmulas.
        Params: lat, lon, start_date, end_date
        """
        # 1. Primero obtenemos los parámetros (Corrigiendo el error de tu snippet anterior)
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        start_str = request.query_params.get('start_date')
        end_str = request.query_params.get('end_date')

        if not all([lat, lon, start_str, end_str]):
            return Response({"error": "Faltan parámetros (lat, lon, start_date, end_date)"}, status=400)

        try:
            # 2. Parseo de fechas
            s_date = datetime.strptime(start_str, "%Y-%m-%d").date()
            e_date = datetime.strptime(end_str, "%Y-%m-%d").date()
            
            if s_date >= e_date:
                return Response({"error": "La fecha de inicio debe ser anterior a la final"}, status=400)

            # 3. Llamada al servicio pasando el USUARIO para la hidratación de datos
            # 🟢 AQUÍ ESTÁ EL CAMBIO CLAVE: request.user
            data = get_historical_climatology(request.user, float(lat), float(lon), s_date, e_date)
            
            return Response(data)

        except ValueError as ve:
            return Response({"error": str(ve)}, status=400)
        except Exception as e:
            print(f"Server Error: {e}")
            return Response({"error": "Error interno procesando climatología"}, status=500)
        
    @action(detail=False, methods=['post'])
    def commit_history(self, request):
        """
        Endpoint explícito para GUARDAR los datos históricos en la tabla operativa.
        """
        lat = request.data.get('lat')
        lon = request.data.get('lon')
        
        if not lat or not lon:
            return Response({"error": "Faltan coordenadas"}, status=400)

        try:
            # Llamamos al nuevo servicio de guardado
            from .services import sync_historical_to_daily
            result = sync_historical_to_daily(request.user, float(lat), float(lon))
            
            return Response({
                "message": "Sincronización exitosa",
                "details": result
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class IrrigationSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = IrrigationSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return IrrigationSettings.objects.filter(user=self.request.user)
        
    def get_object(self):
        obj, _ = IrrigationSettings.objects.get_or_create(user=self.request.user)
        return obj

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # Endpoint para obtener las opciones de fórmulas disponibles
    @action(detail=False, methods=['get'])
    def choices(self, request):
        eto_options = [
            {"value": k, "label": v} 
            for k, v in ETOFormulas.METHOD_LABELS.items()
        ]
        
        rain_options = [
            {"value": k, "label": v} 
            for k, v in IrrigationSettings.RAIN_METHODS
        ]

        return Response({
            "eto_methods": eto_options,
            "rain_methods": rain_options
        })

class ClimateStudyViewSet(viewsets.ModelViewSet):
    serializer_class = ClimateStudySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ClimateStudy.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)