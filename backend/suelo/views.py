from rest_framework import generics, permissions
from .models import Soil
from .serializers import SoilSerializer

class SoilListCreateView(generics.ListCreateAPIView):
    """
    Maneja la lista de suelos y la creación de nuevos perfiles de suelo.
    Solo muestra los suelos que pertenecen al usuario autenticado.
    """
    serializer_class = SoilSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # PRINCIPIO DE MENOR PRIVILEGIO: Solo retorno lo que es del usuario
        return Soil.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Inyectamos el usuario automáticamente al guardar
        serializer.save(user=self.request.user)

class SoilDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Permite ver, editar o borrar un suelo específico.
    """
    serializer_class = SoilSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Soil.objects.filter(user=self.request.user)