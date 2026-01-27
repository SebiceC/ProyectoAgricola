from rest_framework import serializers
from .models import Soil

class SoilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Soil
        fields = '__all__'
        read_only_fields = ('user',)

    def validate_profundidad_radicular_max(self, value):
        """ Validación de Seguridad: Unidades """
        # Si el usuario manda 100 (pensando en cm), le avisamos. Un suelo de 100 metros no existe.
        if value > 5.0:
            raise serializers.ValidationError("La profundidad parece incorrecta. Asegúrese de usar METROS (ej: 1.2m), no centímetros.")
        return value

    def create(self, validated_data):
        # Inyección de dependencia del usuario (Security Best Practice)
        user = self.context['request'].user
        validated_data.pop('user', None)
        return Soil.objects.create(user=user, **validated_data)