from django.contrib import admin
from .models import Crop, CropToPlant, IrrigationExecution

@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'user', 'kc_inicial', 'kc_medio', 'kc_fin')
    list_filter = ('user',)
    search_fields = ('nombre',)

@admin.register(CropToPlant)
class CropToPlantAdmin(admin.ModelAdmin):
    # Ajustado a los campos disponibles en CropToPlant
    list_display = ('crop', 'user', 'fecha_siembra', 'soil', 'area', 'activo')
    list_filter = ('activo', 'fecha_siembra', 'user')
    search_fields = ('user__email', 'crop__nombre')

@admin.register(IrrigationExecution)
class IrrigationExecutionAdmin(admin.ModelAdmin):
    # Ajustado a IrrigationExecution (usa 'timestamp', no 'created_at')
    list_display = ('planting', 'date', 'water_volume_mm', 'timestamp', 'was_suggested')
    list_filter = ('date', 'was_suggested', 'user')
    ordering = ('-date',)