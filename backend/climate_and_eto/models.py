from django.db import models
from django.contrib.postgres.fields import ArrayField



class Eto(models.Model):
    CALCULATION_METHOD_CHOICES = [
    ('penman-monteith', 'FAO Penman-Monteith'),
    ('hargreaves', 'Hargreaves-Samani (1985)'),
    ('turc', 'Turc'),
    ('makkink', 'Makkink (1957)'),
    ('makkink-abstew', 'Makkink-Abstew'),
    ('simple-abstew', 'Simple Abstew (1996)'),
    ('priestley-taylor', 'Priestley-Taylor'),
    ('ivanov', 'Ivanov (1954)'),
    ('christiansen', 'Christiansen'),
]
    id_eto = models.AutoField(primary_key=True)
    country = models.CharField(max_length=100)
    station_name = models.CharField(max_length=100)
    altitude = models.FloatField(help_text="on meters above sea level")
    latitude = models.FloatField(help_text="in decimal degrees")
    longitude = models.FloatField(help_text="in decimal degrees")
    
    #daily data
    maximum_temperature_daily = models.JSONField(null=True, blank=True)
    minimum_temperature_daily = models.JSONField(null=True, blank=True)
    relative_humidity_daily = models.JSONField(null=True, blank=True)
    wind_speed_daily = models.JSONField(null=True, blank=True)
    sunshine_hours_daily = models.JSONField(null=True, blank=True)

    #average data
    average_max_temp = models.FloatField(null=True, blank=True)
    average_min_temp = models.FloatField(null=True, blank=True)
    average_relative_humidity = models.FloatField(null=True, blank=True)
    average_wind_speed = models.FloatField(null=True, blank=True)
    average_sunshine_hours = models.FloatField(null=True, blank=True)

    reference_evapotranspiration = models.FloatField(null=False)
    calculation_method = models.CharField(
        max_length=30,
        choices=CALCULATION_METHOD_CHOICES,
        default='penman-monteith',
        help_text="Method used to calculate reference evapotranspiration"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)



    
    class Meta:
        db_table = "eto"

    def __str__(self):
        return f"ETo ({self.start_date} a {self.end_date}) - {self.station_name} [{self.calculation_method}]"

        