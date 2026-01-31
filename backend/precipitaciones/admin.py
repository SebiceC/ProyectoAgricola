from django.contrib import admin
from .models import Station, PrecipitationRecord

@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    # 'Station' tiene: user, name, latitude, longitude, is_active
    list_display = ('name', 'user', 'latitude', 'longitude', 'is_active')
    list_filter = ('is_active', 'user')
    search_fields = ('name', 'user__email')

@admin.register(PrecipitationRecord)
class PrecipitationRecordAdmin(admin.ModelAdmin):
    # 'PrecipitationRecord' tiene: station, date, precipitation_mm, effective..., source, created_at
    list_display = ('station', 'date', 'precipitation_mm', 'effective_precipitation_mm', 'source', 'created_at')
    list_filter = ('source', 'date', 'station')
    ordering = ('-date',)