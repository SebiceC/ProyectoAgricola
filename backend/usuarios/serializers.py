from rest_framework import serializers
<<<<<<< HEAD
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
        
=======
from django.contrib.auth import get_user_model
from .models import Roles
import re

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'password', 'password2'
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Este correo ya está registrado.')
        return value

    def validate_password(self, value):
        # Al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo
        pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:\'\"\\|,.<>\/?]).{8,}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.')
        return value

    def validate_first_name(self, value):
        if not re.match(r'^[A-Za-záéíóúÁÉÍÓÚñÑ ]+$', value):
            raise serializers.ValidationError('Los nombres solo pueden contener letras y espacios.')
        return value

    def validate_last_name(self, value):
        if not re.match(r'^[A-Za-záéíóúÁÉÍÓÚñÑ ]+$', value):
            raise serializers.ValidationError('Los apellidos solo pueden contener letras y espacios.')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Las contraseñas no coinciden.'})
        return data

    def create(self, validated_data):
        # Asignar el rol 'Usuario' automáticamente
        rol_usuario = Roles.objects.get(nombre_rol='Usuario')
        user = User(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            rol_usuario=rol_usuario,
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('El código OTP debe contener solo números.')
        return value 
>>>>>>> 52e6676 (feat: actualiza requirements.txt y configura manejo de finales de línea)
