from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

class Station(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stations')
    name = models.CharField(max_length=100, verbose_name="Nombre Estación")
    
    # Validaciones Geográficas (Integridad de Datos)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, 
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
        help_text="Latitud decimal (-90 a 90)"
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, 
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
        help_text="Longitud decimal (-180 a 180)"
    )
    is_active = models.BooleanField(default=True, verbose_name="Activa")

    def __str__(self):
        return f"{self.name}"

    class Meta:
        verbose_name = "Estación Pluviométrica"
        verbose_name_plural = "Estaciones"


class PrecipitationRecord(models.Model):
    SOURCE_CHOICES = [
        ('MANUAL', 'Pluviómetro Manual'),
        ('CHIRPS', 'Satélite CHIRPS'),
        ('NASA', 'NASA POWER'),
    ]

    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='records')
    
    date = models.DateField(verbose_name="Fecha de Registro", db_index=True)
    
    # Datos en milímetros
    precipitation_mm = models.FloatField(
        verbose_name="Precipitación Total (mm)",
        validators=[MinValueValidator(0.0)],
        help_text="Lluvia bruta medida"
    )
    
    # Campo calculado (USDA)
    effective_precipitation_mm = models.FloatField(
        verbose_name="Precipitación Efectiva (mm)",
        null=True, blank=True,
        help_text="Agua realmente aprovechable por la raíz"
    )
    
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='MANUAL')
    created_at = models.DateTimeField(auto_now_add=True) # Auditoría

    class Meta:
        # Evita duplicados para la misma estación en el mismo día
        unique_together = ('station', 'date')
        ordering = ['-date']
        verbose_name = "Registro de Lluvia"

    def __str__(self):
        return f"{self.date} - {self.precipitation_mm}mm ({self.station.name})"

    # Calculamos el valor efectivo automáticamente antes de guardar.
    def save(self, *args, **kwargs):
        if self.effective_precipitation_mm is None or self.source == 'MANUAL':
            self.effective_precipitation_mm = self.precipitation_mm
            
        elif self.source != 'MANUAL' and self.effective_precipitation_mm is None:
             self.effective_precipitation_mm = self.precipitation_mm
            
        super().save(*args, **kwargs)

class PrecipitationStudy(models.Model):
    """
    Modelo para guardar instantáneas de análisis de lluvia histórica.
    No afecta los datos en crudo diarios, sirve como reporte generado.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="precipitation_studies")
    name = models.CharField(max_length=100, verbose_name="Nombre del Estudio")
    
    # Metadatos del análisis
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name="studies")
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Aquí guardamos TODO el resultado del cálculo (la lista de meses con promedios)
    result_data = models.JSONField(verbose_name="Datos Calculados") 
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Estudio Pluviométrico"
        verbose_name_plural = "Estudios Pluviométricos"

    def __str__(self):
        return f"{self.name} ({self.created_at.date()})"