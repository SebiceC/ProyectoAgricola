from rest_framework import serializers
from .models import Station, PrecipitationRecord
from datetime import timedelta

class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = ['id', 'user', 'name', 'latitude', 'longitude']
        read_only_fields = ['user']

class PrecipitationRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrecipitationRecord
        fields = ['id', 'station', 'year', 'month', 'precipitation', 'effective_precipitation']

class CargarPrecipitacionInputSerializer(serializers.Serializer):
    station_id = serializers.IntegerField(required=True)
    year = serializers.IntegerField(required=True, min_value=1981)

class PrecipitacionDiariaRangoInputSerializer(serializers.Serializer):
    station_id = serializers.IntegerField(required=True)
    start_date = serializers.DateField(required=True)
    end_date = serializers.DateField(required=True)

    def validate(self, data):
        # Validar rango máximo de 31 días
        if data['end_date'] < data['start_date']:
            raise serializers.ValidationError("La fecha final debe ser mayor o igual a la inicial.")
        if (data['end_date'] - data['start_date']).days > 30:
            raise serializers.ValidationError("El rango máximo permitido es de 31 días.")
        return data