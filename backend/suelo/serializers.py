from rest_framework import serializers
from .models import Soil

class SoilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Soil
        fields = '__all__'
        read_only_fields = ['user']

    def create(self, validated_data):
        user = self.context['request'].user
        return Soil.objects.create(user=user, **validated_data)
