from rest_framework import serializers
from .models import Riegos


class RiegosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Riegos
        fields = (
            "id_riego",
            "id_cultivo",
            "fecha_riego",
            "cantidad_agua",
            "tipo_riego",
        )
        read_only_fields = "id_riego"
