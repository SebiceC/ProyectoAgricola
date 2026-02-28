import os
import django
import sys
from datetime import date

sys.path.append('/home/sececa/portfolioProyects/ProyectoAgricola/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from precipitaciones.services import obtener_y_guardar_precipitacion_diaria_rango
from precipitaciones.models import Station

if __name__ == '__main__':
    st = Station.objects.first()
    if st:
        import time
        start_t = time.time()
        res = obtener_y_guardar_precipitacion_diaria_rango(
            st, st.latitude, st.longitude, date(2021, 1, 1), date(2025, 1, 1)
        )
        print("Time taken:", time.time() - start_t)
        print("Registros downloaded:", len(res))
    else:
        print("No stations")
