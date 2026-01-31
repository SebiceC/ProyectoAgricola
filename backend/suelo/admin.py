from django.contrib import admin
from .models import Soil

@admin.register(Soil)
class SoilAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'user', 'textura', 'capacidad_campo', 'punto_marchitez')
    # Si 'tasa_max_infiltracion' da error, bórralo de list_display
    list_filter = ('textura', 'user')
    search_fields = ('nombre', 'user__email')