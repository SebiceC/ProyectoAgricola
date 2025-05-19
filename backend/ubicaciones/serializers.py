from rest_framework import serializers
from .models import Ubicacion, Suelo, Precipitacion, Eto
from datetime import date

class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = ["id_ubicacion", "nombre_ubicacion", "pais_ubicacion", "latitud", "longitud", "altitud"]

class SueloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suelo
        fields = ["id_suelo", "nombre_suelo", "textura_suelo", "capacidad_campo", "saturacion", "agua_disponible"]
        
class PrecipitacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Precipitacion
        fields = ["id_precipitacion", "id_ubicacion", "fecha", "precipitacion_anual", "precipitacion_mensual", "precipitacion_total", "precipitacion_efectiva"]

class EtoSerializer(serializers.ModelSerializer):
    ubicacion = UbicacionSerializer(source="id_ubicacion", read_only=True)


    class Meta:
        model = Eto
        fields = ["id_eto", "ubicacion", "id_ubicacion", "fecha", "temperatura_maxima", "temperatura_minima", "humedad_relativa", "velocidad_viento", "horas_insolacion", "precipitacion", "evapotranspiracion_potencial"]
        
class EtoCalculationSerializer(serializers.ModelSerializer):
    id_ubicacion = serializers.PrimaryKeyRelatedField(queryset=Ubicacion.objects.all())
    start_date = serializers.DateField(default=date.today)
    end_date = serializers.DateField(default=date.today)

    def validate(self, data):
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError("La fecha de inicio no puede ser posterior a la fecha de fin.")
        if data["end_date"] > date.today():
            raise serializers.ValidationError("La fecha de fin no puede ser futura.")
        return data
    
class NasaPowerRequestSerializer(serializers.ModelSerializer):
    latitud = serializers.FloatField(
        min_value=-90.0, 
        max_value=90.0, 
        help_text="Latitud de la ubicación (entre -90 y 90 grados)"
    )
    longitud = serializers.FloatField(
        min_value=-180.0, 
        max_value=180.0, 
        help_text="Longitud de la ubicación (entre -180 y 180 grados)"
    )
    start_date = serializers.DateField(
        help_text="Fecha de inicio para la consulta (YYYY-MM-DD)"
    )
    end_date = serializers.DateField(
        help_text="Fecha de fin para la consulta (YYYY-MM-DD)"
    )

    def validate(self, data):
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError("La fecha de inicio no puede ser posterior a la fecha de fin.")
        
        if data["end_date"] > date.today():
            raise serializers.ValidationError("La fecha de fin no puede ser futura.")
        
        max_days = 30
        if (data["end_date"] - data["start_date"]).days > max_days:
            raise serializers.ValidationError(f"La consulta no puede exceder {max_days} días.")

        return data
