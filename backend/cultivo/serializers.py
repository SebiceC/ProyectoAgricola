from rest_framework import serializers
from .models import Crop, CropToPlant

class CropSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crop
        fields = '__all__'

class CropToPlantSerializer(serializers.ModelSerializer):
    crear_nuevo_cultivo = serializers.BooleanField(write_only=True)
    crop_data = CropSerializer(write_only=True, required=False)
    crop = serializers.PrimaryKeyRelatedField(queryset=Crop.objects.all(), required=False)

    class Meta:
        model = CropToPlant
        fields = [
            'id', 'crear_nuevo_cultivo', 'crop', 'crop_data',
            'fecha_siembra', 'fecha_cosecha', 'altura'
        ]
    
    def validate(self, attrs):
        crear_nuevo = attrs.get('crear_nuevo_cultivo')
        crop_data = attrs.get('crop_data')
        crop = attrs.get('crop')

        if crear_nuevo and not crop_data:
            raise serializers.ValidationError("Si 'crear_nuevo_cultivo' es True, debe proveer 'crop_data'.")
        if not crear_nuevo and not crop:
            raise serializers.ValidationError("Si 'crear_nuevo_cultivo' es False, debe proveer 'crop'.")

        # Validar altura dentro del rango
        jika_crop = crop if crop else None
        jika_crop_data = crop_data if crop_data else None

        if crear_nuevo and crop_data:
            altura_min = crop_data.get('altura_min')
            altura_max = crop_data.get('altura_max')
        elif crop:
            altura_min = crop.altura_min
            altura_max = crop.altura_max
        else:
            altura_min = None
            altura_max = None

        altura = attrs.get('altura')
        if altura_min is not None and altura_max is not None:
            if not (altura_min <= altura <= altura_max):
                raise serializers.ValidationError(f"La altura debe estar entre {altura_min} y {altura_max}")

        return attrs

    def create(self, validated_data):
        crear_nuevo = validated_data.pop('crear_nuevo_cultivo')
        crop_data = validated_data.pop('crop_data', None)
        crop = validated_data.pop('crop', None)
        user = self.context['request'].user
        
        # Eliminar user si ya existe para no duplicar al pasar por kwargs
        validated_data.pop('user', None)
        
        if crear_nuevo and crop_data:
            crop = Crop.objects.create(**crop_data)
        elif not crear_nuevo and crop:
            pass
        else:
            raise serializers.ValidationError("Error al crear la plantación")

        return CropToPlant.objects.create(crop=crop, user=user, **validated_data)
