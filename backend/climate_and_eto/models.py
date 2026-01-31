from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class DailyWeather(models.Model):
    """
    Modelo Operativo Diario.
    Fuente de verdad única para el cálculo de riego.
    Permite mezclar datos de NASA con datos manuales del usuario.
    """
    SOURCE_CHOICES = [
        ('NASA', 'NASA POWER API'),
        ('STATION', 'Estación Local / Sensor'),
        ('MANUAL', 'Ingreso Manual'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="weather_records")
    date = models.DateField(db_index=True, verbose_name="Fecha")
    
    # Coordenadas (Para diferenciar si el usuario tiene fincas en climas distintos)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    # --- VARIABLES CLIMÁTICAS (Datos Crudos) ---
    # Permitimos nulos porque a veces el sensor falla o NASA no trae todo
    temp_max = models.FloatField(verbose_name="T Max (°C)", null=True, blank=True)
    temp_min = models.FloatField(verbose_name="T Min (°C)", null=True, blank=True)
    humidity_mean = models.FloatField(verbose_name="Humedad Relativa (%)", null=True, blank=True)
    wind_speed = models.FloatField(verbose_name="Velocidad Viento (m/s)", null=True, blank=True)
    solar_rad = models.FloatField(verbose_name="Radiación Solar (MJ/m2/d)", null=True, blank=True)
    
    # --- RESULTADO (Calculado o Ingresado) ---
    eto_mm = models.FloatField(verbose_name="ETo (mm/día)", help_text="Evapotranspiración de Referencia")
    
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='NASA')
    is_manual_override = models.BooleanField(default=False, help_text="Si es True, la API no sobreescribirá este dato")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'date') # Un registro por día por usuario
        ordering = ['-date']
        verbose_name = "Clima Diario Operativo"

    def __str__(self):
        return f"{self.date} - ETo: {self.eto_mm} ({self.source})"


class IrrigationSettings(models.Model):
    """
    Configuraciones de Fórmulas (Estilo CROPWAT).
    """
    # 🟢 LISTA AMPLIADA DE FÓRMULAS
    ETO_METHODS = [
        ("HARGREAVES", "Hargreaves-Samani (Solo Temperatura)"),
        ("PENMAN", "Penman-Monteith (Estándar FAO / Completo)"),
        ("TURC", "Turc (Climas Húmedos)"),
        ("MAKKINK", "Makkink (Radiación y Temp)"),
        ("MAKKINK_ABSTEW", "Makkink-Abstew (Calibrado)"),
        ("PRIESTLEY", "Priestley-Taylor (Sin Viento)"),
        ("IVANOV", "Ivanov (Humedad y Temp)"),
        ("CHRISTIANSEN", "Christiansen (Datos Completos)"),
    ]
    
    RAIN_METHODS = [
        ('USDA', 'USDA S.C. Method (Recomendado)'),
        ('FIXED', 'Porcentaje Fijo (Ej: 80%)'),
        ('DEPENDABLE', 'Lluvia Confiable (FAO)'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='irrigation_settings')
    
    # Preferencias de Cálculo
    preferred_eto_method = models.CharField(max_length=30, choices=ETO_METHODS, default='PENMAN')
    effective_rain_method = models.CharField(max_length=20, choices=RAIN_METHODS, default='USDA')
    
    # Eficiencia del Sistema (Afecta el Riego Neto)
    system_efficiency = models.FloatField(
        default=0.90, 
        validators=[MinValueValidator(0.1), MaxValueValidator(1.0)],
        help_text="0.90 para Goteo, 0.75 para Aspersión, 0.60 Gravedad"
    )

    def __str__(self):
        return f"Configuración de {self.user.username}"