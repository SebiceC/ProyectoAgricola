from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
import random
import string

class Roles(models.Model):
    """
    Modelo que representa los roles de usuario.
    """
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=100, blank=True, null=True)
    descripcion_rol = models.CharField(max_length=255, blank=True, null=True)
    permisos_rol = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nombre_rol or "Rol sin nombre"

    class Meta:
        db_table = "roles"
        verbose_name = "Roles"

class CustomUser(AbstractUser):
    """
    Usuario personalizado que extiende el modelo de usuario de Django.
    """
    id = models.AutoField(primary_key=True)
    rol_usuario = models.ForeignKey(Roles, on_delete=models.CASCADE, db_column="id_rol", blank=True, null=True)
    document_id = models.CharField(max_length=30, blank=True, null=True, verbose_name="Documento de identidad")
    fecha_nacimiento = models.DateField(blank=True, null=True, verbose_name="Fecha de nacimiento")
    pais = models.CharField(max_length=100, blank=True, null=True, verbose_name="País")
    institucion = models.CharField(max_length=255, blank=True, null=True, verbose_name="Institución")
    tipo_usuario = models.CharField(max_length=50, blank=True, null=True, verbose_name="Tipo de usuario")
    carrera = models.CharField(max_length=100, blank=True, null=True, verbose_name="Carrera")
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name="Teléfono")
    fecha_registro = models.DateTimeField(default=timezone.now, verbose_name="Fecha de registro")

    def __str__(self):
        return self.username

    class Meta:
        db_table = "usuarios_customuser"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='Grupos',
        blank=True,
        help_text="Los grupos a los que pertenece este usuario. Un usuario obtendrá todos los permisos otorgados a cada uno de sus grupos.",
        related_name="customuser_set",
        related_query_name="customuser",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='Permisos de usuario',
        blank=True,
        help_text="Permisos específicos para este usuario.",
        related_name="customuser_set",
        related_query_name="customuser",
    )

class UserOTP(models.Model):
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at

    @staticmethod
    def generate_otp():
        return ''.join(random.choices(string.digits, k=6))
