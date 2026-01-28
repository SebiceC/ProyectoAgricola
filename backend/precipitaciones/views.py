from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Station, PrecipitationRecord
from .serializers import StationSerializer, PrecipitationRecordSerializer

# ------------------------------------------------------------------
# VISTAS DE ESTACIONES (Infraestructura)
# ------------------------------------------------------------------

class StationListCreateView(generics.ListCreateAPIView):
    """
    Lista las estaciones del usuario o crea una nueva.
    """
    serializer_class = StationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # 🛡️ Principio de Mínimo Privilegio: Solo devuelve estaciones del usuario actual
        return Station.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Asigna automáticamente el usuario dueño
        serializer.save(user=self.request.user)

class StationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Ver, Editar o Eliminar una estación específica.
    """
    serializer_class = StationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Station.objects.filter(user=self.request.user)

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