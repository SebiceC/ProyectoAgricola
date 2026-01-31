from django.db import models
from django.conf import settings

class Soil(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Identificación
    nombre = models.CharField(max_length=100, help_text="Ej: Lote Norte")
    textura = models.CharField(max_length=50, help_text="Ej: Franco, Arcilloso")
    
    # Propiedades Hidrodinámicas (Nombres exactos requeridos por views.py)
    capacidad_campo = models.FloatField(help_text="CC (% Vol)", default=0.0)
    punto_marchitez = models.FloatField(help_text="PMP (% Vol)", default=0.0)
    densidad_aparente = models.FloatField(help_text="Da (g/cm3)", default=1.2)

    # 🟢 NUEVOS CAMPOS: Ubicación Geográfica (Para el Motor Climático)
    latitude = models.FloatField(verbose_name="Latitud", null=True, blank=True, help_text="Decimal (Ej: 2.92)")
    longitude = models.FloatField(verbose_name="Longitud", null=True, blank=True, help_text="Decimal (Ej: -75.28)")
    
    # Propiedades adicionales para el cálculo avanzado
    tasa_max_infiltracion = models.FloatField(default=0.0, help_text="mm/hora")
    profundidad_radicular_max = models.FloatField(default=1.0, help_text="Metros")
    humedad_disponible = models.FloatField(default=0.0, help_text="Calculado (CC - PMP)")

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.textura})"