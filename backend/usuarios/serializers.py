from rest_framework import serializers
from .models import CustomUser, Roles

class RolesSerializer(serializers.Serializer):
    class Meta:
        model = Roles
        fields = "__all_"

class CustomUserSerializer(serializers.Serializer):
    class Meta:
        model = CustomUser
        fields = "__all__"
        