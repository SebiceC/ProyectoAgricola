from rest_framework import serializers
from django.contrib.auth import get_user_model
import re
from django.contrib.auth.models import Group  # <-- Añade este import

User = get_user_model()


class UserRegisterSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(
        required=True, 
        min_length=2, 
        max_length=50,
        error_messages={
            'blank': 'El nombre no puede estar vacío.',
            'min_length': 'El nombre debe tener al menos 2 caracteres.',
            'max_length': 'El nombre no puede tener más de 50 caracteres.'
        }
    )
    last_name = serializers.CharField(
        required=True, 
        min_length=2, 
        max_length=50,
        error_messages={
            'blank': 'El apellido no puede estar vacío.',
            'min_length': 'El apellido debe tener al menos 2 caracteres.',
            'max_length': 'El apellido no puede tener más de 50 caracteres.'
        }
    )
    document_id = serializers.CharField(
        required=True,
        error_messages={
            'blank': 'El documento de identidad no puede estar vacío.'
        }
    )
    email = serializers.EmailField(
        required=True,
        error_messages={
            'blank': 'El correo electrónico no puede estar vacío.',
            'invalid': 'Ingrese un correo electrónico válido.'
        }
    )
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        error_messages={
            'blank': 'La contraseña no puede estar vacía.',
            'min_length': 'La contraseña debe tener al menos 8 caracteres.'
        }
    )
    password2 = serializers.CharField(
        write_only=True, 
        min_length=8,
        error_messages={
            'blank': 'La confirmación de contraseña no puede estar vacía.',
            'min_length': 'La confirmación de contraseña debe tener al menos 8 caracteres.'
        }
    )
    
    fecha_nacimiento = serializers.DateField(
        required=True,
        error_messages={
            'blank': 'La fecha de nacimiento no puede estar vacía.',
            'invalid': 'Ingrese una fecha válida.'
        }
    )
    pais = serializers.CharField(
        required=True,
        error_messages={
            'blank': 'El país no puede estar vacío.'
        }
    )
    institucion = serializers.CharField(required=False, allow_blank=True)
    carrera = serializers.CharField(required=False, allow_blank=True)
    telefono = serializers.CharField(
        required=True,
        error_messages={
            'blank': 'El teléfono no puede estar vacío.'
        }
    )

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'password', 'password2',
            'document_id', 'fecha_nacimiento', 'pais', 'institucion', 'carrera', 'telefono'
        ]

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('El correo electrónico no puede estar vacío.')
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Este correo ya está registrado.')
        return value

    def validate_password(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('La contraseña no puede estar vacía.')
        # Al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo
        pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:\'\"\\|,.<>\/?]).{8,}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.')
        return value

    def validate_first_name(self, value):
        # Validar que no esté vacío
        if not value or not value.strip():
            raise serializers.ValidationError('El nombre no puede estar vacío.')
        
        # Validar que solo contenga letras y espacios
        if not re.match(r'^[A-Za-záéíóúÁÉÍÓÚñÑ ]+$', value):
            raise serializers.ValidationError('El nombre solo puede contener letras y espacios.')
        
        # Validar longitud mínima y máxima
        if len(value) < 2:
            raise serializers.ValidationError('El nombre debe tener al menos 2 caracteres.')
        if len(value) > 50:
            raise serializers.ValidationError('El nombre no puede tener más de 50 caracteres.')
        
        # Validar que no tenga espacios múltiples
        if '  ' in value:
            raise serializers.ValidationError('El nombre no puede contener espacios múltiples.')
        
        # Validar que no empiece ni termine con espacio
        if value.startswith(' ') or value.endswith(' '):
            raise serializers.ValidationError('El nombre no puede empezar ni terminar con espacio.')
        
        return value.strip()

    def validate_last_name(self, value):
        # Validar que no esté vacío
        if not value or not value.strip():
            raise serializers.ValidationError('El apellido no puede estar vacío.')
        
        # Validar que solo contenga letras y espacios
        if not re.match(r'^[A-Za-záéíóúÁÉÍÓÚñÑ ]+$', value):
            raise serializers.ValidationError('El apellido solo puede contener letras y espacios.')
        
        # Validar longitud mínima y máxima
        if len(value) < 2:
            raise serializers.ValidationError('El apellido debe tener al menos 2 caracteres.')
        if len(value) > 50:
            raise serializers.ValidationError('El apellido no puede tener más de 50 caracteres.')
        
        # Validar que no tenga espacios múltiples
        if '  ' in value:
            raise serializers.ValidationError('El apellido no puede contener espacios múltiples.')
        
        # Validar que no empiece ni termine con espacio
        if value.startswith(' ') or value.endswith(' '):
            raise serializers.ValidationError('El apellido no puede empezar ni terminar con espacio.')
        
        return value.strip()

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Las contraseñas no coinciden.'})
        return data

    def create(self, validated_data):
        # Asignar el rol 'Usuario' automáticamente
        user = User(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            document_id=validated_data.get('document_id', ''),
            fecha_nacimiento=validated_data.get('fecha_nacimiento'),
            pais=validated_data.get('pais', ''),
            institucion=validated_data.get('institucion', ''),
            carrera=validated_data.get('carrera', ''),
            telefono=validated_data.get('telefono', '')
        )
        user.set_password(validated_data['password'])
        user.save()

        # Asigna grupo "Usuario" por defecto
        grupo_usuario = Group.objects.get(name='Usuario')  # Asegúrate de que exista
        user.groups.add(grupo_usuario)
        return user
    
    def update(self, instance, validated_data):
        """
        Método para actualizar una instancia existente de User.
        Parámetros:
            instance: Instancia del modelo User que se va a actualizar
            validated_data: Diccionario con los datos ya validados
        """
        # 1. Actualizar campos básicos
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        
        # 2. Actualizar campos adicionales del CustomUser
        instance.document_id = validated_data.get('document_id', instance.document_id)
        instance.fecha_nacimiento = validated_data.get('fecha_nacimiento', instance.fecha_nacimiento)
        instance.pais = validated_data.get('pais', instance.pais)
        instance.institucion = validated_data.get('institucion', instance.institucion)
        instance.carrera = validated_data.get('carrera', instance.carrera)
        instance.telefono = validated_data.get('telefono', instance.telefono)
        
        # 3. Manejar actualización de contraseña si se proporciona
        password = validated_data.get('password', None)
        if password:
            instance.set_password(password)
        
        # 4. Guardar los cambios
        instance.save()
        
        # 5. Retornar la instancia actualizada
        return instance


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        error_messages={
            'blank': 'El correo electrónico no puede estar vacío.',
            'invalid': 'Ingrese un correo electrónico válido.'
        }
    )
    password = serializers.CharField(
        error_messages={
            'blank': 'La contraseña no puede estar vacía.'
        }
    )

class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        error_messages={
            'blank': 'El correo electrónico no puede estar vacío.',
            'invalid': 'Ingrese un correo electrónico válido.'
        }
    )
    otp = serializers.CharField(
        required=True, 
        min_length=6, 
        max_length=6,
        error_messages={
            'blank': 'El código OTP no puede estar vacío.',
            'min_length': 'El código OTP debe tener 6 dígitos.',
            'max_length': 'El código OTP debe tener 6 dígitos.'
        }
    )

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('El código OTP debe contener solo números.')
        return value
    
    