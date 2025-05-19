from rest_framework import serializers
from .models import Cultivos, Etapa, CultivoSuelo, CultivoUbicacion

class CultivosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cultivos
        fields = (
            "id_cultivo",
            "nombre_cultivo",
            "fecha_siembra",
            "fecha_cosecha",
            "profundidad_radicular",
            "factor_agotamiento",
            "factor_respuesta",
        )
        read_only_fields = ("id_cultivo",)
        

class EtapaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etapa
        fields = (
            "id_etapa",
            "nombre_etapa",
            "id_cultivo",
            "diametro_cultivo",
            "kc_inicial",
            "kc_medio",
            "kc_final",
        )
        read_only_fields = ("id_etapa",)

class CultivoSueloSerializer(serializers.ModelSerializer):
    class Meta:
        model = CultivoSuelo
        fields = (
            "id_cultivo",
            "id_suelo",
        )
        read_only_fields = ("id_cultivo","id_suelo",)

class CultivoUbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CultivoUbicacion
        fields = (
            "id_cultivo",
            "id_ubicacion",
        )
        read_only_fields = ("id_cultivo","id_ubicacion",)