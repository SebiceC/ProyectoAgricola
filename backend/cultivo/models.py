from django.db import models
from django.conf import settings
from datetime import date

class Crop(models.Model):
    # SEGURIDAD: Null=True permite cultivos "del sistema" (FAO) visibles para todos
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    nombre = models.CharField(max_length=100)

    # Coeficientes Kc (Adimensionales)
    kc_inicial = models.FloatField()
    kc_medio = models.FloatField()
    kc_fin = models.FloatField()
    # Nota: kc_desarrollo suele ser una interpolación lineal, pero lo dejamos si quieres guardarlo explícito.


    # Duración de etapas (Días)
    etapa_inicial = models.IntegerField(help_text="Duración etapa inicial (días)")
    etapa_desarrollo = models.IntegerField(help_text="Duración etapa desarrollo (días)")
    etapa_medio = models.IntegerField(help_text="Duración etapa media (días)")
    etapa_final = models.IntegerField(help_text="Duración etapa final (días)")

    # Profundidad (ESTANDARIZADO A METROS)
    # Simplificamos: La raíz crece de prof_radicular_ini a prof_radicular_max
    prof_radicular_ini = models.FloatField(help_text="Profundidad radicular inicial (m)")
    prof_radicular_max = models.FloatField(help_text="Profundidad radicular maxima (m)")
    
    # Parámetros de Estrés
    agotam_critico = models.FloatField(help_text="Fracción p (0.0 - 1.0)")
    factor_respuesta_rend = models.FloatField(help_text="Factor de respuesta a rendimiento")
    

    altura_max = models.FloatField(help_text="Altura máxima (m)")

    def __str__(self):
        return self.nombre

class CropToPlant(models.Model):
    """
    Esta es la "Siembra" activa
    """
    crop = models.ForeignKey(Crop, on_delete=models.PROTECT)  #PROTECT: No borrar historial si se borra el cultivo base
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    fecha_siembra = models.DateField()

    soil = models.ForeignKey('suelo.Soil', on_delete=models.SET_NULL, null=True, blank=True, related_name='plantings')

    # Campo calculado opcional (lo ideal es calcularlo en backend)
    fecha_cosecha_estimada = models.DateField(null=True, blank=True)

    # Estado del cultivo
    area = models.FloatField(help_text="Área sembrada en Hectáreas", default=1.0)
    activo = models.BooleanField(default=True)
    
    
    def __str__(self):
        return f"{self.crop.nombre} - {self.fecha_siembra}"

class IrrigationExecution(models.Model):
    """
    Log de Auditoría: Registra cada evento de riego ejecutado.
    Permite trazar el historial hídrico y calcular costos futuros.
    """
    planting = models.ForeignKey(CropToPlant, on_delete=models.CASCADE, related_name='irrigations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    date = models.DateField(default=date.today, verbose_name="Fecha de Aplicación")
    water_volume_mm = models.FloatField(verbose_name="Lámina Aplicada (mm)")
    
    # Metadatos para auditoría
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Hora de Registro")
    was_suggested = models.BooleanField(default=True, help_text="¿Siguió la recomendación del sistema?")
    
    class Meta:
        ordering = ['-date', '-timestamp']
        verbose_name = "Ejecución de Riego"
        verbose_name_plural = "Historial de Riegos"

    def __str__(self):
        return f"{self.date} - {self.water_volume_mm}mm en {self.planting}"