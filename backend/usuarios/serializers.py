from rest_framework import serializers
from .models import CustomUser, Roles

class RolesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Roles
        fields = ("id_rol", "nombre_rol", "descripcion_rol", "permisos_rol")
        read_only_fields = ("id_rol",)

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            "id_usuario",
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "rol_usuario",
        )
        read_only_fields = ("id_usuario",)
        