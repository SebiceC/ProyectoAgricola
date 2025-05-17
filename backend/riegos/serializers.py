from rest_framework import serializers
from .models import Riegos

class RiegosSerializer(serializers.Serializer):
    class Meta:
        model = Riegos
        fields = "__all_"
        