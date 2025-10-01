from django.db import models
from django.conf import settings

class Soil(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    humedad_disponible = models.FloatField(help_text="Humedad de suelo disponible total (CC-PMP) en mm/metro")
    tasa_max_infiltracion = models.FloatField(help_text="Tasa máxima de infiltración de la precipitación en mm/día")
    profundidad_radicular_max = models.FloatField(help_text="Profundidad radicular máxima en cm")
    agotamiento_inicial = models.FloatField(help_text="Agotamiento inicial de humedad de suelo (% de ADT)")
    humedad_inicial = models.FloatField(help_text="Humedad de suelo inicialmente disponible en mm/metro")

    def __str__(self):
        if self.user:
            return f"{self.nombre} (Usuario: {self.user.username})"
        return f"{self.nombre} (Base)"
