from rest_framework import serializers
from .models import Crop, CropToPlant, IrrigationExecution
from suelo.models import Soil


class CropSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crop
        fields = '__all__'
        read_only_fields = ('user',)

    def validate(self, data):
        """ Validaciones de seguridad agronómica """
        # Ejemplo: El Kc no suele pasar de 1.4 en ningún cultivo estándar
        if data.get('kc_medio') and data.get('kc_medio') > 1.6:
            raise serializers.ValidationError({"kc_medio": "El coeficiente Kc medio parece inusualmente alto (>1.6)."})
        return data

class CropToPlantSerializer(serializers.ModelSerializer):
    # Campos de control para el Frontend
    crear_nuevo_cultivo = serializers.BooleanField(write_only=True, default=False)
    crop_data = CropSerializer(write_only=True, required=False)
    crop_name = serializers.CharField(source='crop.nombre', read_only=True)
    
    # Nested Serializer para LEER (ver detalles del cultivo en el JSON de respuesta)
    crop_details = CropSerializer(source='crop', read_only=True)
    
    # Campo para seleccionar cultivo existente
    crop = serializers.PrimaryKeyRelatedField(queryset=Crop.objects.all(), required=False)

    # Campos de solo lectura (Calculados)
    densidad_calculada = serializers.FloatField(read_only=True)

    soil = serializers.PrimaryKeyRelatedField(
        queryset=Soil.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = CropToPlant
        fields = [
            'id', 
            'crear_nuevo_cultivo', 
            'crop',
            'crop_name', 
            'crop_data', 
            'crop_details',  # Para que el frontend vea qué cultivo es
            'fecha_siembra', 
            'area', 
            'activo',
            'soil',
            'distancia_surcos',
            'distancia_plantas',
            'densidad_calculada',
            'fecha_cosecha_estimada'
        ]
        read_only_fields = ('user',) # Seguridad: El usuario se inyecta en el backend

    def validate(self, attrs):
        # Si es una actualización parcial (PATCH), 'crear_nuevo_cultivo' podría no venir.
        # Asumimos False si no viene.
        crear_nuevo = attrs.get('crear_nuevo_cultivo', False)
        crop_data = attrs.get('crop_data')
        crop = attrs.get('crop')

        # Solo validamos la lógica de "Crear vs Existente" si estamos CREANDO una siembra (POST)
        # o si se enviaron esos campos explícitamente en un PATCH.
        if self.instance is None or (crear_nuevo or crop):
            if crear_nuevo:
                if not crop_data:
                    raise serializers.ValidationError("Si selecciona 'Crear Nuevo', debe enviar 'crop_data'.")
                serializer_validacion = CropSerializer(data=crop_data)
                serializer_validacion.is_valid(raise_exception=True)
            else:
                # Si no crea nuevo, exigimos ID de crop (a menos que ya exista en la instancia)
                if not crop and not self.instance:
                    raise serializers.ValidationError("Debe enviar el ID de un 'crop' existente.")

        return attrs

    def create(self, validated_data):
        crear_nuevo = validated_data.pop('crear_nuevo_cultivo', False)
        crop_data = validated_data.pop('crop_data', None)
        
        user = self.context['request'].user
        
        if crear_nuevo and crop_data:
            crop = Crop.objects.create(user=user, **crop_data)
        else:
            crop = validated_data.pop('crop')
        
        validated_data.pop('user', None)

        # Al crear, 'soil' ya vendrá dentro de **validated_data gracias a la definición del campo arriba
        planting = CropToPlant.objects.create(
            user=user,
            crop=crop,
            **validated_data
        )
        return planting

    # ✅ 2. MAGIA DE LECTURA (to_representation)
    # Esto convierte el simple ID "5" en el objeto "{id:5, nombre:'Franco', ...}"
    def to_representation(self, instance):
        response = super().to_representation(instance)
        if instance.soil:
            # ✅ IMPORTACIÓN PEREZOSA (LAZY IMPORT):
            # Importamos aquí dentro para evitar el Error Circular que tumba el servidor
            from suelo.serializers import SoilSerializer 
            response['soil'] = SoilSerializer(instance.soil).data
        return response


class IrrigationExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = IrrigationExecution
        fields = ['id', 'planting', 'date', 'water_volume_mm', 'timestamp', 'was_suggested']
        read_only_fields = ['user', 'timestamp']