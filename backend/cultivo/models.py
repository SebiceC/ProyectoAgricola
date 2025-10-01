from django.db import models
from django.conf import settings

class Crop(models.Model):
    nombre = models.CharField(max_length=100)
    kc_inicial = models.FloatField()
    kc_desarrollo = models.FloatField()
    kc_medio = models.FloatField()
    kc_fin = models.FloatField()
    etapa_inicial = models.IntegerField(help_text="Duración etapa inicial (días)")
    etapa_desarrollo = models.IntegerField(help_text="Duración etapa desarrollo (días)")
    etapa_medio = models.IntegerField(help_text="Duración etapa media (días)")
    etapa_final = models.IntegerField(help_text="Duración etapa final (días)")
    prof_radicular_ini = models.FloatField(help_text="Profundidad radicular inicial (m)")
    prof_radicular_desarrollo = models.FloatField(help_text="Profundidad radicular desarrollo (m)")
    prof_radicular_medio = models.FloatField(help_text="Profundidad radicular media (m)")
    prof_radicular_final = models.FloatField(help_text="Profundidad radicular final (m)")
    agotam_critico = models.FloatField(help_text="Agotamiento crítico (fracción)")
    factor_respuesta_rend = models.FloatField(help_text="Factor de respuesta a rendimiento")
    altura_min = models.FloatField(help_text="Altura mínima del cultivo (m)")
    altura_max = models.FloatField(help_text="Altura máxima del cultivo (m)")

    def __str__(self):
        return self.nombre

class CropToPlant(models.Model):
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    fecha_siembra = models.DateField()
    fecha_cosecha = models.DateField()
    altura = models.FloatField()

    def __str__(self):
        return f"{self.crop.nombre} - {self.user.username} ({self.fecha_siembra} a {self.fecha_cosecha})"
