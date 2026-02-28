import sys
sys.path.append('/home/sececa/portfolioProyects/ProyectoAgricola/backend')

altitude = 14
latitude = 24.82
days_of_year = [15, 46, 75, 106, 136, 167, 197, 228, 259, 289, 320, 350]

data = [
    {"mes": "Enero", "t_min": 12.8, "t_max": 27.0, "rh": 74, "ws": 2.4, "sun": 6.0, "rad": 12.9, "eto_cropwat": 2.91},
    {"mes": "Febrero", "t_min": 13.5, "t_max": 28.4, "rh": 70, "ws": 2.4, "sun": 6.6, "rad": 15.5, "eto_cropwat": 3.57},
    {"mes": "Marzo", "t_min": 15.1, "t_max": 30.6, "rh": 66, "ws": 2.2, "sun": 7.4, "rad": 18.7, "eto_cropwat": 4.42},
    {"mes": "Abril", "t_min": 15.9, "t_max": 32.3, "rh": 61, "ws": 2.0, "sun": 6.9, "rad": 19.7, "eto_cropwat": 4.93},
    {"mes": "Mayo", "t_min": 18.2, "t_max": 34.1, "rh": 62, "ws": 1.8, "sun": 7.8, "rad": 21.7, "eto_cropwat": 5.34},
    {"mes": "Junio", "t_min": 21.3, "t_max": 35.1, "rh": 65, "ws": 1.8, "sun": 7.3, "rad": 21.0, "eto_cropwat": 5.34},
    {"mes": "Julio", "t_min": 23.9, "t_max": 36.0, "rh": 74, "ws": 1.9, "sun": 6.3, "rad": 19.4, "eto_cropwat": 5.02},
    {"mes": "Agosto", "t_min": 23.8, "t_max": 35.7, "rh": 78, "ws": 1.9, "sun": 6.4, "rad": 19.0, "eto_cropwat": 4.79},
    {"mes": "Septiembre", "t_min": 23.6, "t_max": 35.4, "rh": 79, "ws": 1.8, "sun": 6.4, "rad": 17.8, "eto_cropwat": 4.42},
    {"mes": "Octubre", "t_min": 20.9, "t_max": 34.5, "rh": 76, "ws": 1.7, "sun": 7.3, "rad": 16.9, "eto_cropwat": 4.12},
    {"mes": "Noviembre", "t_min": 16.5, "t_max": 30.3, "rh": 72, "ws": 1.8, "sun": 6.9, "rad": 14.3, "eto_cropwat": 3.34},
    {"mes": "Diciembre", "t_min": 13.4, "t_max": 26.9, "rh": 75, "ws": 2.2, "sun": 5.9, "rad": 12.2, "eto_cropwat": 2.74},
]

from climate_and_eto.eto_formules import ETOFormulas

base_etos = []
for row_idx, row in enumerate(data):
    ETOFormulas._use_sunshine = False
    eto = ETOFormulas.penman_monteith(
        temp_max=row['t_max'], temp_min=row['t_min'], humidity=row['rh'], 
        wind_speed=row['ws'], radiation=row['rad'], latitude=latitude,
        day_of_year=days_of_year[row_idx], elevation=altitude, cropwat_legacy_mode=False
    )
    base_etos.append(eto)

import numpy as np
crop_etos = [r['eto_cropwat'] for r in data]
x = np.array(base_etos)
y = np.array(crop_etos)

z = np.polyfit(x, y, 1)
p = np.poly1d(z)

max_diff = 0
print(f"Polynomial: {z[0]:.4f} * ETo + {z[1]:.4f}")
for i in range(len(x)):
    corrected = round(p(x[i]), 2)
    diff = abs(corrected - y[i])
    max_diff = max(max_diff, diff)

print(f"Max Diff Linear Regression: {max_diff:.2f}")

z2 = np.polyfit(x, y, 2)
p2 = np.poly1d(z2)
max_diff2 = 0
for i in range(len(x)):
    corrected = round(p2(x[i]), 2)
    diff = abs(corrected - y[i])
    max_diff2 = max(max_diff2, diff)
print(f"Max Diff Quadratic: {max_diff2:.2f}  Poly: {z2[0]:.6f}*x^2 + {z2[1]:.6f}*x + {z2[2]:.6f}")

