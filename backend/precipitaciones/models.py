from django.db import models
from django.conf import settings

class Station(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stations')
    name = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True)
    longitude = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.latitude}, {self.longitude})"


class PrecipitationRecord(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='precipitations')
    year = models.IntegerField()
    month = models.IntegerField()
    precipitation = models.FloatField()  # Datos de CHIRPS o medidos
    effective_precipitation = models.FloatField(null=True, blank=True)  # Resultado fórmula USDA S.C.

    class Meta:
        unique_together = ('station', 'year', 'month')
        ordering = ['year', 'month']

    def __str__(self):
        return f"Precipitación {self.month}/{self.year} - {self.station.name}"
