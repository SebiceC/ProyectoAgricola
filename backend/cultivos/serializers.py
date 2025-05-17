from rest_framework import serializers
from .models import Cultivos, Etapa, CultivoSuelo, CultivoUbicacion

class CultivosSerializer(serializers.Serializer):
    class Meta:
        model = Cultivos
        fields = "__all_"

class EtapaSerializer(serializers.Serializer):
    class Meta:
        model = Etapa
        fields = "__all__"

class CultivoSueloSerializer(serializers.Serializer):
    class Meta:
        model = CultivoSuelo
        fields = "__all__"

class CultivoUbicacionSerializer(serializers.Serializer):
    class Meta:
        model = CultivoUbicacion
        fields = "__all__"