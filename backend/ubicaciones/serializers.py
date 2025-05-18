from rest_framework import serializers
from .models import Ubicacion, Suelo, Precipitacion, Eto

class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = "__all_"

class SueloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suelo
        fields = "__all__"
        
class PrecipitacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Precipitacion
        fields = "__all__"

class EtoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Eto
        fields = "__all__"
        