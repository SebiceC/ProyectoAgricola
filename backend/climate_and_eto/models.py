from django.db import models
from django.conf import settings
from django.utils import timezone

# Create your models here.

class DailyMetereologicalData(models.Model):
   """Conjunto de datos meteorológicos diarios en un periodo (ej. un mes)"""

   user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="meteorological_datasets")
   start_date = models.DateField()   # inicio del periodo (ej. 2025-09-01)
   end_date = models.DateField()     # fin del periodo (ej. 2025-09-30)

   latitude = models.FloatField()
   longitude = models.FloatField()
   altitude = models.FloatField()

    # Todos los datos diarios se guardan como JSON
    # Estructura recomendada: {"YYYY-MM-DD": { "temp_max": ..., "temp_min": ..., ... }}
   daily_data = models.JSONField()

   created_at = models.DateTimeField(auto_now_add=True)  # trazabilidad
   updated_at = models.DateTimeField(auto_now=True)

   class Meta:
       unique_together = ("start_date", "end_date", "latitude", "longitude", "user")

   def __str__(self):
       return f"Datos {self.start_date} a {self.end_date} - ({self.latitude}, {self.longitude}) por {self.user}"

class MetereologicalSummary(models.Model):
    """Datos metereologicos ya promediados (mensuales u otros periodos)"""

    PERIOD = [
        ('MONTHLY', 'Monthly'),
        ('WEEKLY', 'Weekly'),
    ]

    period_type = models.CharField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    altitude = models.FloatField(null=True, blank=True)

    average_temp_max = models.FloatField(null=True, blank=True)
    average_temp_min = models.FloatField(null=True, blank=True)
    average_temp = models.FloatField(null=True, blank=True)
    average_relative_humidity = models.FloatField(null=True, blank=True)
    average_radiation_solar = models.FloatField(null=True, blank=True)
    average_wind_speed = models.FloatField(null=True, blank=True)

    data_source = models.CharField(
        max_length=10,
        choices=[('MANUAL','Manual'), ('API', 'API')],
    )

    raw_data = models.JSONField(blank=True, null=True)

    class Meta:
        unique_together = ('start_date', 'end_date', 'latitude', 'longitude')

    def __str__(self):
        return f"{self.period_type} {self.start_date} to {self.end_date}"

class EtoCalculated(models.Model):
    """Resultados de calculo de evapotransporacion de referencia (ETO)"""
    ETO_METHODS = [
        ("penman-monteith", "FAO Penman-Monteith"),
        ("hargreaves", "Hargreaves-Samani (1985)"),
        ("turc", "Turc"),
        ("makkink", "Makkink (1957)"),
        ("makkink-abstew", "Makkink-Abstew"),
        ("simple-abstew", "Simple Abstew (1996)"),
        ("priestley-taylor", "Priestley-Taylor"),
        ("ivanov", "Ivanov (1954)"),
        ("christiansen", "Christiansen"),
    ]

    SOURCES = [
        ('MANUAL', 'Manual'),
        ('API', 'API'),
    ]
    method_name = models.CharField(max_length=100, blank=True, null=True, choices=ETO_METHODS)
    data_source = models.CharField(max_length=100, blank=True, null=True, choices=SOURCES)
    calculation_date = models.DateField(blank=True, null=True)
    
    # Relación: puede ser con datos diarios o con resumen
    daily_data = models.ManyToManyField(DailyMetereologicalData, blank=True)
    summary_data = models.ForeignKey(MetereologicalSummary, on_delete=models.CASCADE, null=True, blank=True)
    
    eto = models.FloatField(blank=True, null=True)
    observations = models.TextField(blank=True, null=True)

    def __str__(self):
        if self.eto is not None:
            return f"{self.get_method_name_display()} - {self.eto:.2f} mm/day"
        return f"{self.get_method_name_display()} - No ETO calculated"    
            