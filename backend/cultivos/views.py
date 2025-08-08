from .models import Cultivos, Etapa
from rest_framework import viewsets, permissions
from .serializers import CultivosSerializer, EtapaSerializer


class CultivosViewSet(viewsets.ModelViewSet):
    queryset = Cultivos.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = CultivosSerializer


class EtapaViewSet(viewsets.ModelViewSet):
    queryset = Etapa.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = EtapaSerializer
