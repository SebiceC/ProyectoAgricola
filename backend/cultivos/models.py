from django.db import models

class Cultivos(models.Model):
    id_cultivo = models.AutoField(primary_key=True)
    nombre_cultivo = models.CharField(max_length=100)
    fecha_siembra = models.DateField(blank=True, null=True)
    fecha_cosecha = models.DateField(blank=True, null=True)
    profundidad_radicular = models.FloatField(blank=True, null=True)
    factor_agotamiento = models.FloatField(blank=True, null=True)
    factor_respuesta = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "cultivos"

class Etapa(models.Model):
    id_etapa = models.AutoField(primary_key=True)
    nombre_etapa = models.CharField(max_length=100, blank=True, null=True)
    id_cultivo = models.ForeignKey("cultivos.Cultivos", on_delete=models.CASCADE, db_column="id_cultivo", blank=True, null=True)
    diametro_cultivo = models.FloatField(blank=True, null=True)
    kc_inicial = models.FloatField(blank=True, null=True)
    kc_medio = models.FloatField(blank=True, null=True)
    kc_final = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "etapas"

class CultivoSuelo(models.Model):
    id_cultivo = models.ForeignKey("cultivos.Cultivos", on_delete=models.CASCADE, db_column="id_cultivo", blank=True, null=True)
    id_suelo = models.ForeignKey("ubicaciones.Suelo", on_delete=models.CASCADE, db_column="id_suelo", blank=True, null=True)

    class Meta:
        db_table = "cultivo_suelo"

class CultivoUbicacion(models.Model):
    id_cultivo = models.ForeignKey("cultivos.Cultivos", on_delete=models.CASCADE, db_column="id_cultivo", blank=True, null=True)
    id_ubicacion = models.ForeignKey("ubicaciones.Ubicacion", on_delete=models.CASCADE, db_column="id_ubicacion", blank=True, null=True)

    class Meta:
        db_table = "cultivo_ubicacion"