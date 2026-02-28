import sys
import os

# To make it run standalone without Django settings, we can just import the ETOFormulas directly.
sys.path.append('/home/sececa/portfolioProyects/ProyectoAgricola/backend')

from climate_and_eto.eto_formules import ETOFormulas

# Bogota typical data
t_max = 20.0
t_min = 10.0
rh = 75.0
ws = 2.0
rad = 18.0
lat = 4.6
day_of_year = 150
pressure = None # We will let it calculate it

eto_0_elev = ETOFormulas.penman_monteith(t_max, t_min, rh, ws, rad, lat, day_of_year, elevation=0, pressure=pressure)
eto_2100_elev = ETOFormulas.penman_monteith(t_max, t_min, rh, ws, rad, lat, day_of_year, elevation=2100, pressure=pressure)

print(f"ETo without elevation (0m): {eto_0_elev}")
print(f"ETo with elevation (2100m): {eto_2100_elev}")
print(f"Difference: {abs(eto_2100_elev - eto_0_elev):.2f} mm/day")

