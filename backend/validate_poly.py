import sys
import copy
sys.path.append('/home/sececa/portfolioProyects/ProyectoAgricola/backend')
from climate_and_eto.eto_formules import ETOFormulas
import math

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

month_lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

def get_interp(m_idx, day_of_month):
    # CROPWAT uses linear interpolation between the 15th of each month
    cur = data[m_idx]
    if day_of_month <= 15:
        # Interpolate with previous month
        prev_idx = (m_idx - 1) % 12
        prev = data[prev_idx]
        
        days_between = 15 + (month_lengths[prev_idx] - 15)
        current_offset = day_of_month + (month_lengths[prev_idx] - 15)
        
        w_cur = current_offset / days_between
        w_prev = 1.0 - w_cur
    else:
        # Interpolate with next month
        next_idx = (m_idx + 1) % 12
        nx = data[next_idx]
        
        days_between = (month_lengths[m_idx] - 15) + 15
        current_offset = day_of_month - 15
        
        w_nx = current_offset / days_between
        w_cur = 1.0 - w_nx
        prev = nx
        
    res = {}
    for k in ['t_max', 't_min', 'rh', 'ws', 'sun', 'rad']:
        res[k] = cur[k] * w_cur + prev[k] * (1.0 - w_cur)
    return res

max_diff = 0
for m in range(12):
    total_eto = 0
    start_doy = sum(month_lengths[:m])
    
    for d in range(1, month_lengths[m] + 1):
        doy = start_doy + d
        row = get_interp(m, d)
        
        ETOFormulas._use_sunshine = True
        eto = ETOFormulas.penman_monteith(
            temp_max=row['t_max'], temp_min=row['t_min'], humidity=row['rh'], 
            wind_speed=row['ws'], radiation=row['rad'], latitude=latitude, 
            day_of_year=doy, elevation=altitude, cropwat_legacy_mode=False
        )
        total_eto += eto
        
    avg_eto = round(total_eto / month_lengths[m], 2)
    diff = abs(avg_eto - data[m]['eto_cropwat'])
    max_diff = max(max_diff, diff)
    print(f"Month {m+1} -> Cropwat: {data[m]['eto_cropwat']:.2f}, Simulated Interpolation: {avg_eto:.2f}, Diff: {diff:.2f}")
    
print(f"Max difference from daily interpolation simulation: {max_diff:.2f}")

