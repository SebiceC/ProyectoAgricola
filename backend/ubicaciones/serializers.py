from rest_framework import serializers
from .models import Ubicacion, Suelo, Precipitacion, Eto

class UbicacionSerializer(serializers.Serializer):
    class Meta:
        model = Ubicacion
        fields = "__all_"

class SueloSerializer(serializers.Serializer):
    class Meta:
        model = Suelo
        fields = "__all__"
        
class PrecipitacionSerializer(serializers.Serializer):
    class Meta:
        model = Precipitacion
        fields = "__all__"

class EtoSerializer(serializers.Serializer):
    class Meta:
        model = Eto
        fields = "__all__"
        