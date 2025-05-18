from rest_framework import serializers
from .models import Cultivos, Etapa, CultivoSuelo, CultivoUbicacion

class CultivosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cultivos
        fields = "__all_"

class EtapaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etapa
        fields = "__all__"

class CultivoSueloSerializer(serializers.ModelSerializer):
    class Meta:
        model = CultivoSuelo
        fields = "__all__"

class CultivoUbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CultivoUbicacion
        fields = "__all__"