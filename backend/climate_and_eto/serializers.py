from rest_framework import serializers
from .models import DailyMetereologicalData, MetereologicalSummary, EtoCalculated

class DailyMetereologicalDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMetereologicalData
        fields = '__all__'
        read_only_fields = ['id']

class MetereologicalSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = MetereologicalSummary
        fields = '__all__'
        read_only_fields = ['id', 'raw_data']

class EtoCalculatedSerializer(serializers.ModelSerializer):
    # Relaciona con datos diarios y resumen con sus serializadores

    daily_data = DailyMetereologicalDataSerializer(many=True, read_only=True)
    summary_data = MetereologicalSummarySerializer(read_only=True)

    # Envio de IDs al crear las relaciones
    daily_data_ids = serializers.PrimaryKeyRelatedField(
        queryset=DailyMetereologicalData.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    summary_data_id = serializers.PrimaryKeyRelatedField(
        queryset=MetereologicalSummary.objects.all(),
        write_only=True,
        required=False
    )

    class Meta:
        model = EtoCalculated
        fields = [
            "id",
            "method_name",
            "data_source",
            "calculation_date",
            "daily_data",
            "summary_data",
            "daily_data_ids",
            "summary_data_id",
            "eto",
            "observations"
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        daily_data_ids = validated_data.pop('daily_data_ids', [])
        summary_data_id = validated_data.pop('summary_data_id', None)

        eto_calculated = EtoCalculated.objects.create(**validated_data)

        if daily_data_ids:
            eto_calculated.daily_data.set(daily_data_ids)
        if summary_data_id:
            eto_calculated.summary_data = summary_data_id
            eto_calculated.save()

        return eto_calculated
    

# Serializers para la documentacion

class CalculateETORequestSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    method = serializers.ChoiceField(
        choices=['penman-monteith', 'hargreaves', 'turc', 'makkink', 'makkink-abstew', 'simple-abstew', 'priestley-taylor', 'ivanon', 'christiansen'],
        default='penman-monteith'
    )
    altitude = serializers.FloatField(required=False, default=0)

    ETO_METHODS = [
        ("penman-monteith", "FAO Penman-Monteith"),
        ("hargreaves", "Hargreaves-Samani (1985)"),
        ("turc", "Turc"),
        ("makkink", "Makkink (1957)"),
        ("makkink-abstew", "Makkink-Abstew"),
        ("simple-abstew", "Simple Abstew (1996)"),
        ("priestley-taylor", "Priestley-Taylor"),
        ("ivanov", "Ivanov (1954)"),
        ("christiansen", "Christiansen"),
    ]


class CalculateETOResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    eto = serializers.FloatField()
    method = serializers.CharField()
    period = serializers.CharField()
    coordinates = serializers.CharField()
    observations = serializers.CharField(allow_blank=True)
