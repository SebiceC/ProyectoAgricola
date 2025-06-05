from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser



@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = (
        'username', 'first_name', 'last_name', 'email', 
        'document_id', 'fecha_nacimiento', 'pais', 'institucion', 'carrera', 'telefono', 'is_active'
    )
    search_fields = ('username', 'first_name', 'last_name', 'email', 'document_id')
    ordering = ('username',)

    fieldsets = (
        ('Credenciales', {'fields': ('username', 'password')}),
        ('Información personal', {
            'fields': (
                'first_name', 'last_name', 'email', 
                'document_id', 'fecha_nacimiento', 'pais', 'institucion', 'carrera', 'telefono'
            )
        }),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas importantes', {'fields': ('last_login', 'date_joined', 'fecha_registro')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2', 'first_name', 'last_name',
                'document_id', 'fecha_nacimiento', 'pais', 'institucion', 'carrera', 'telefono'
            ),
        }),
    )
