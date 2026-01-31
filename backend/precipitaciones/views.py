from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from datetime import datetime, timedelta

from .models import Station, PrecipitationRecord
from .serializers import StationSerializer, PrecipitationRecordSerializer
from .services import obtener_y_guardar_precipitacion_diaria_rango

# ------------------------------------------------------------------
# VISTAS DE ESTACIONES (Infraestructura)
# ------------------------------------------------------------------

class StationViewSet(viewsets.ModelViewSet):
    """
    Maneja el CRUD de estaciones y la sincronización con satélites.
    """
    serializer_class = StationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # 🛡️ Principio de Mínimo Privilegio: Solo devuelve estaciones del usuario actual
        return Station.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Asigna automáticamente el usuario dueño
        serializer.save(user=self.request.user)

    # 🚀 ACCIÓN NUEVA: Descargar datos satelitales CHIRPS
    @action(detail=True, methods=['post'])
    def fetch_chirps(self, request, pk=None):
        station = self.get_object()
        
        # Por defecto bajamos los últimos 30 días si no envían fechas en el body
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        # Opcional: permitir rango custom desde el body (JSON)
        if 'start_date' in request.data:
            try:
                start_date = datetime.strptime(request.data['start_date'], '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Formato start_date inválido (YYYY-MM-DD)"}, status=400)
                
        if 'end_date' in request.data:
            try:
                end_date = datetime.strptime(request.data['end_date'], '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Formato end_date inválido (YYYY-MM-DD)"}, status=400)

        try:
            # Llamada a Google Earth Engine (Servicio)
            resultados = obtener_y_guardar_precipitacion_diaria_rango(
                station=station,
                lat=station.latitude,
                lon=station.longitude,
                start_date=start_date,
                end_date=end_date
            )
            return Response({
                "message": f"Sincronización exitosa. Se procesaron {len(resultados)} días.",
                "data": resultados
            })
        except Exception as e:
            print(f"Error CHIRPS: {e}")
            return Response(
                {"error": "Error conectando con satélite CHIRPS. Verifica credenciales de Earth Engine o intenta más tarde."}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

# ------------------------------------------------------------------
# VISTAS DE REGISTROS DE LLUVIA (Operación Diaria)
# ------------------------------------------------------------------

class PrecipitationRecordListCreateView(generics.ListCreateAPIView):
    """
    Maneja el listado histórico y el registro manual de nuevas lluvias.
    """
    serializer_class = PrecipitationRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Devuelve registros donde la estación asociada pertenece al usuario
        # Ordenados del más reciente al más antiguo
        return PrecipitationRecord.objects.filter(
            station__user=self.request.user
        ).order_by('-date')

    def perform_create(self, serializer):
        """
        Validación de Seguridad Crítica:
        Evita que un usuario registre lluvias en una estación ajena enviando un ID manipulado.
        """
        station = serializer.validated_data['station']
        
        # 🛡️ Validación de Propiedad (Broken Object Level Authorization)
        if station.user != self.request.user:
            raise PermissionDenied("No tienes permiso para registrar lluvias en esta estación.")
            
        serializer.save()

class PrecipitationRecordDetailView(generics.RetrieveDestroyAPIView):
    """
    Permite eliminar un registro incorrecto (ej: dedo mal puesto).
    """
    serializer_class = PrecipitationRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PrecipitationRecord.objects.filter(station__user=self.request.user)