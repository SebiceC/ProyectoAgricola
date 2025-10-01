from django.db import migrations

def create_initial_crops(apps, schema_editor):
    Crop = apps.get_model('cultivo', 'Crop')
    crops_data = [
        {
            "nombre": "Maíz",
            "kc_inicial": 0.30,
            "kc_desarrollo": 1.20,
            "kc_medio": 1.20,
            "kc_fin": 0.60,
            "etapa_inicial": 30,
            "etapa_desarrollo": 25,
            "etapa_medio": 40,
            "etapa_final": 30,
            "prof_radicular_ini": 0.4,
            "prof_radicular_desarrollo": 0.8,
            "prof_radicular_medio": 1.2,
            "prof_radicular_final": 1.2,
            "agotam_critico": 0.55,
            "factor_respuesta_rend": 1.25,
            "altura_min": 1.0,
            "altura_max": 2.0
        },
        {
            "nombre": "Trigo Primavera",
            "kc_inicial": 0.30,
            "kc_desarrollo": 1.15,
            "kc_medio": 1.15,
            "kc_fin": 0.25,
            "etapa_inicial": 15,
            "etapa_desarrollo": 25,
            "etapa_medio": 50,
            "etapa_final": 30,
            "prof_radicular_ini": 0.3,
            "prof_radicular_desarrollo": 0.5,
            "prof_radicular_medio": 1.0,
            "prof_radicular_final": 1.5,
            "agotam_critico": 0.55,
            "factor_respuesta_rend": 1.10,
            "altura_min": 0.9,
            "altura_max": 1.1
        },
        {
            "nombre": "Papa",
            "kc_inicial": 0.30,
            "kc_desarrollo": 1.15,
            "kc_medio": 1.15,
            "kc_fin": 0.65,
            "etapa_inicial": 25,
            "etapa_desarrollo": 30,
            "etapa_medio": 30,
            "etapa_final": 30,
            "prof_radicular_ini": 0.3,
            "prof_radicular_desarrollo": 0.4,
            "prof_radicular_medio": 0.5,
            "prof_radicular_final": 0.6,
            "agotam_critico": 0.35,
            "factor_respuesta_rend": 1.05,
            "altura_min": 0.4,
            "altura_max": 0.6
        },
        {
            "nombre": "Caña de Azúcar",
            "kc_inicial": 0.40,
            "kc_desarrollo": 1.25,
            "kc_medio": 1.25,
            "kc_fin": 0.75,
            "etapa_inicial": 35,
            "etapa_desarrollo": 50,
            "etapa_medio": 190,
            "etapa_final": 120,
            "prof_radicular_ini": 0.9,
            "prof_radicular_desarrollo": 1.2,
            "prof_radicular_medio": 1.6,
            "prof_radicular_final": 2.0,
            "agotam_critico": 0.65,
            "factor_respuesta_rend": 1.10,
            "altura_min": 2.0,
            "altura_max": 3.0
        },
        {
            "nombre": "Frijol",
            "kc_inicial": 0.40,
            "kc_desarrollo": 1.15,
            "kc_medio": 1.15,
            "kc_fin": 0.35,
            "etapa_inicial": 20,
            "etapa_desarrollo": 25,
            "etapa_medio": 40,
            "etapa_final": 20,
            "prof_radicular_ini": 0.2,
            "prof_radicular_desarrollo": 0.3,
            "prof_radicular_medio": 0.35,
            "prof_radicular_final": 0.4,
            "agotam_critico": 0.45,
            "factor_respuesta_rend": 1.10,
            "altura_min": 0.3,
            "altura_max": 0.5
        }
    ]
    for crop_data in crops_data:
        Crop.objects.create(**crop_data)

class Migration(migrations.Migration):

    dependencies = [
        ('cultivo', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_crops),
    ]
