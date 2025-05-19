from django.db import models

class Ubicacion(models.Model):
    id_ubicacion = models.AutoField(primary_key=True)
    nombre_ubicacion = models.CharField(max_length=100, blank=True, null=True)
    pais_ubicacion = models.CharField(max_length=100, blank=True, null=True)
    latitud = models.FloatField(blank=True, null=True)
    longitud = models.FloatField(blank=True, null=True)
    altitud = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "ubicaciones"

    def __str__(self):
        return f"{self.nombre_ubicacion} ({self.latitud}, {self.longitud})"

class Suelo(models.Model):
    id_suelo = models.AutoField(primary_key=True)
    nombre_suelo = models.CharField(max_length=100, blank=True, null=True)
    textura_suelo = models.CharField(max_length=100, blank=True, null=True)
    capacidad_campo = models.FloatField(blank=True, null=True)
    saturacion = models.FloatField(blank=True, null=True)
    agua_disponible = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "suelos"

class Precipitacion(models.Model):
    id_precipitacion = models.AutoField(primary_key=True)
    id_ubicacion = models.ForeignKey("ubicaciones.Ubicacion", on_delete=models.CASCADE, db_column="id_ubicacion", blank=True, null=True)
    fecha = models.DateField(blank=True, null=True)
    precipitacion_anual = models.FloatField(blank=True, null=True)
    precipitacion_mensual = models.FloatField(blank=True, null=True)
    precipitacion_total = models.FloatField(blank=True, null=True)
    precipitacion_efectiva = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "precipitaciones"

class Eto(models.Model):
    id_eto = models.AutoField(primary_key=True)
    id_ubicacion = models.ForeignKey("ubicaciones.Ubicacion", on_delete=models.CASCADE, db_column="id_ubicacion", blank=True, null=True)
    fecha = models.DateField(blank=True, null=True)
    temperatura_maxima = models.FloatField(blank=True, null=True)
    temperatura_minima = models.FloatField(blank=True, null=True)
    humedad_relativa = models.FloatField(blank=True, null=True)
    velocidad_viento = models.FloatField(blank=True, null=True)
    horas_insolacion = models.FloatField(blank=True, null=True)
    precipitacion = models.FloatField(blank=True, null=True)
    evapotranspiracion_potencial = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "eto"
        ordering = ["-fecha"]

    def __str__(self):
        return f"ETO {self.fecha} - {self.id_ubicacion.nombre_ubicacion}"

        