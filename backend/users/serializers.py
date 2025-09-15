# serializers.py
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import CustomUser
from django.contrib.auth.models import Group




class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id','name', 'email', 'password', 'role']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        user = super().create(validated_data)
    
        # asignar grupo por defecto
        try:
            group = Group.objects.get(name="Usuario")
            user.groups.add(group)
        except Group.DoesNotExist:
            # si el grupo no existe, no hacemos nada
            pass

        return user

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)
    
    def get_role(self, obj):
        return list(obj.groups.values_list('name',flat=True))


class AssignRoleSerializer(serializers.Serializer):
    role = serializers.CharField(write_only=True)

    def validate_role(self, value):
        if not Group.objects.filter(name=value).exists():
            raise serializers.ValidationError(f"El rol '{value}' no existe")
        return value

    def update(self, instance, validated_data):
        role_name = validated_data.get("role")
        instance.groups.clear()
        group = Group.objects.get(name=role_name)
        instance.groups.add(group)
        instance.save()
        return instance
    
class RemoveRoleSerializer(serializers.Serializer):
    role = serializers.CharField()

    def update(self, instance, validated_data):
        role_name = validated_data.get("role")
        instance.groups.remove(*instance.groups.filter(name=role_name))
        return instance
