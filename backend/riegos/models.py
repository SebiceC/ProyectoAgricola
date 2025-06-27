from django.db import models

class Riegos(models.Model):
    id_riego = models.AutoField(primary_key=True)
    id_cultivo = models.ForeignKey("cultivos.Cultivos", on_delete=models.CASCADE, db_column="id_cultivo", blank=True, null=True)
    fecha_riego = models.DateField(blank=True, null=True)
    cantidad_agua = models.FloatField(blank=True, null=True)
    tipo_riego = models.CharField(max_length=100, blank=True, null=True)
    eficiencia_riego = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "riegos"
