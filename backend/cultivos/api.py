from .models import Cultivos, Etapa, CultivoSuelo, CultivoUbicacion
from rest_framework import viewsets, permissions
from .serializers import CultivosSerializer, EtapaSerializer, CultivoSueloSerializer, CultivoUbicacionSerializer

class CultivosViewSet(viewsets.ModelViewSet):
    queryset = Cultivos.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = CultivosSerializer

class EtapaViewSet(viewsets.ModelViewSet):
    queryset = Etapa.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = EtapaSerializer

class CultivoSueloViewSet(viewsets.ModelViewSet):
    queryset = CultivoSuelo.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = CultivoSueloSerializer

class CultivoUbicacionViewSet(viewsets.ModelViewSet):
    queryset = CultivoUbicacion.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = CultivoUbicacionSerializer
