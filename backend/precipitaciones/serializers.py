from rest_framework import serializers
from .models import Station, PrecipitationRecord

class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = ['id', 'user', 'name', 'latitude', 'longitude', 'is_active']
        read_only_fields = ['user']

class PrecipitationRecordSerializer(serializers.ModelSerializer):
    # Campo extra para mostrar el nombre de la estación en la tabla del frontend
    # sin tener que hacer una petición extra.
    station_name = serializers.ReadOnlyField(source='station.name')

    class Meta:
        model = PrecipitationRecord
        # 🟢 CORRECCIÓN: Usamos los nombres reales de la nueva base de datos
        fields = [
            'id', 
            'station', 
            'station_name', 
            'date',                  # Antes era year/month
            'precipitation_mm',      # Antes era precipitation
            'effective_precipitation_mm', 
            'source',
            'created_at'
        ]
        # Estos campos los calcula el sistema, el usuario no debe enviarlos
        read_only_fields = ['effective_precipitation_mm', 'created_at', 'source']

# NOTA: He eliminado 'CargarPrecipitacionInputSerializer' y 'PrecipitacionDiariaRangoInputSerializer'
# temporalmente porque dependían de la lógica vieja (year/month). 
# Si necesitas carga masiva, debemos reescribirlos para soportar fechas exactas.