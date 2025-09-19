from django.db import migrations

def create_initial_soils(apps, schema_editor):
    Soil = apps.get_model('suelo', 'Soil')
    soils_data = [
        {
            "user_id": None,
            "nombre": "Suelo Franco",
            "humedad_disponible": 150.0,
            "tasa_max_infiltracion": 10.0,
            "profundidad_radicular_max": 100.0,
            "agotamiento_inicial": 30.0,
            "humedad_inicial": 100.0,
        },
        {
            "user_id": None,
            "nombre": "Suelo Arenoso",
            "humedad_disponible": 100.0,
            "tasa_max_infiltracion": 15.0,
            "profundidad_radicular_max": 80.0,
            "agotamiento_inicial": 25.0,
            "humedad_inicial": 60.0,
        },
        {
            "user_id": None,
            "nombre": "Suelo Arcilloso",
            "humedad_disponible": 200.0,
            "tasa_max_infiltracion": 5.0,
            "profundidad_radicular_max": 120.0,
            "agotamiento_inicial": 35.0,
            "humedad_inicial": 150.0,
        },
        {
            "user_id": None,
            "nombre": "Suelo Limoso",
            "humedad_disponible": 180.0,
            "tasa_max_infiltracion": 8.0,
            "profundidad_radicular_max": 110.0,
            "agotamiento_inicial": 28.0,
            "humedad_inicial": 110.0,
        },
        {
            "user_id": None,
            "nombre": "Suelo Calcáreo",
            "humedad_disponible": 130.0,
            "tasa_max_infiltracion": 9.0,
            "profundidad_radicular_max": 90.0,
            "agotamiento_inicial": 29.0,
            "humedad_inicial": 95.0,
        }
    ]
    for soil_data in soils_data:
        Soil.objects.create(**soil_data)

class Migration(migrations.Migration):

    dependencies = [
        ('suelo', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_soils),
    ]
