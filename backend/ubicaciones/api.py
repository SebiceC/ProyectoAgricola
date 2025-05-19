from .models import Ubicacion, Suelo, Precipitacion, Eto
from rest_framework import viewsets, permissions
from .serializers import UbicacionSerializer, SueloSerializer, PrecipitacionSerializer, EtoSerializer

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