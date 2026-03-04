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
    available_formulas = serializers.SerializerMethodField()

    class Meta:
        model = ClimateStudy
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

    def get_available_formulas(self, obj):
        try:
            # result_data structure: [{"month": 1, "month_name": "Jan", "eto_results": {"PENMAN": 5.2, ...}}, ...]
            if obj.result_data and isinstance(obj.result_data, list) and len(obj.result_data) > 0:
                first_month = obj.result_data[0]
                # Las fórmulas están dentro de "eto_results"
                eto_results = first_month.get('eto_results', {})
                if eto_results:
                    return list(eto_results.keys())
                # Fallback: buscar claves numéricas en la raíz
                formulas = [k for k in first_month.keys() if k not in ['mes', 'month', 'month_name', 'name']]
                return formulas
            return []
        except Exception:
            return []