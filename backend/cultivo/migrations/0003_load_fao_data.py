from django.db import migrations
from django.core.management import call_command

def load_fixture(apps, schema_editor):
    """
    Carga los datos iniciales de la FAO desde el fixture.
    Django buscará automáticamente 'cultivos_fao.json' en la carpeta fixtures de la app.
    """
    fixture_file = 'cultivos_fao.json'
    # verbosity=0 evita ensuciar los logs del despliegue con la salida de la carga
    call_command('loaddata', fixture_file, verbosity=0)

def reverse_func(apps, schema_editor):
    """
    Operación de reversión.
    Por principios de seguridad (Data Loss Prevention), NO borramos los datos automáticamente
    al revertir, ya que algún usuario podría haber empezado a usarlos o referenciarlos.
    """
    # Si fuera necesario borrar, aquí usaríamos:
    # Crop = apps.get_model("cultivo", "Crop")
    # Crop.objects.filter(user__isnull=True).delete() # Solo borrar los del sistema
    pass

class Migration(migrations.Migration):

    dependencies = [
        # Esta dependencia asegura que la tabla 'cultivo_crop' ya exista antes de insertar datos
        ('cultivo', '0002_irrigationexecution'),
    ]

    operations = [
        migrations.RunPython(load_fixture, reverse_func),
    ]