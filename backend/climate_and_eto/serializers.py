from rest_framework import serializers
from .models import DailyWeather, IrrigationSettings, ClimateStudy

class DailyWeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyWeather
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

class IrrigationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = IrrigationSettings
        fields = '__all__'
        read_only_fields = ('user',)

class ClimateStudySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClimateStudy
        fields = '__all__'
        read_only_fields = ('user', 'created_at')