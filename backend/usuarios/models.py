from django.db import models
from django.contrib.auth.models import AbstractUser

class Roles(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=100, blank=True, null=True)
    descripcion_rol = models.CharField(max_length=255, blank=True, null=True)
    permisos_rol = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "roles"

class CustomUser(AbstractUser):


    id_usuario = models.AutoField(primary_key=True)
    rol_usuario = models.ForeignKey(Roles, on_delete=models.CASCADE, db_column="id_rol", blank=True, null=True)

    class Meta:
        db_table = "usuarios_customuser"

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text= "The groups this user belongs to. A user will get all permissions granted to each of their groups.",
        related_name="customuser_set",
        related_query_name="customuser",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text="Specific permissions for this user.",
        related_name="customuser_set",
        related_query_name="customuser",
    )
