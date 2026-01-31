from django.contrib import admin
from .models import DailyWeather, IrrigationSettings

@admin.register(DailyWeather)
class DailyWeatherAdmin(admin.ModelAdmin):
    list_display = ('date', 'user', 'eto_mm', 'temp_max', 'source', 'is_manual_override')
    list_filter = ('source', 'date', 'user', 'is_manual_override')
    search_fields = ('user__email',)
    ordering = ('-date',)

@admin.register(IrrigationSettings)
class IrrigationSettingsAdmin(admin.ModelAdmin):
    # Usamos los nombres EXACTOS de tu modelo actual
    list_display = ('user', 'preferred_eto_method', 'effective_rain_method', 'system_efficiency')
    list_filter = ('preferred_eto_method', 'effective_rain_method')
    search_fields = ('user__email',)