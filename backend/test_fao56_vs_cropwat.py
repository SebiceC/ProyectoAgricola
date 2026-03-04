"""
Validación de penman_monteith() contra datos CROPWAT de capeta_pruebas
=============================================================================
Compara la réplica pura FAO-56 con los resultados de CROPWAT 8.0 para
4 estaciones de climas muy distintos:

  1. CAMIRI        — Bolivia (-20.05°, 810m) — Tropical húmedo/seco
  2. CONTULMO      — Chile   (-38.03°,  30m) — Templado oceánico
  3. URANDANGIE    — Australia (-21.60°, 175m) — Desértico árido
  4. WICHITA       — USA     (37.65°, 409m) — Continental

Los archivos .pen de CROPWAT contienen los resultados oficiales del software.
"""

import sys
sys.path.append('/home/sececa/portfolioProyects/ProyectoAgricola/backend')
from climate_and_eto.eto_formules import ETOFormulas

MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

# Día del año para el día 15 de cada mes (FAO-56 Table 2.5)
DAYS_OF_YEAR = [15, 46, 75, 106, 136, 167, 197, 228, 259, 289, 320, 350]

# ═══════════════════════════════════════════════════════════════════
#  DATOS EXTRAÍDOS DE LOS ARCHIVOS .pen DE CROPWAT 8.0
#  Formato: Tmax, Tmin, RH(%), Wind(km/day), Sunshine(h), Rs(MJ/m²/d), ETo_CROPWAT
# ═══════════════════════════════════════════════════════════════════

STATIONS = {
    'CAMIRI (Bolivia)': {
        'lat': -20.05, 'elev': 810,
        'data': [
            (31.5, 18.6, 67.0, 110.6, 9.15, 25.10, 5.38),
            (30.6, 18.5, 69.0,  89.0, 8.51, 23.43, 4.88),
            (29.0, 17.4, 71.0,  93.3, 9.32, 23.01, 4.57),
            (27.5, 15.4, 72.0,  84.7, 8.78, 19.67, 3.65),
            (25.2, 13.2, 71.0,  75.2, 8.42, 16.74, 2.83),
            (23.2, 10.7, 69.0,  89.0, 7.69, 14.64, 2.29),
            (24.7,  9.4, 61.0, 115.8, 7.26, 14.64, 2.57),
            (27.2, 10.7, 52.0, 155.5, 8.41, 17.99, 3.66),
            (29.4, 13.6, 48.0, 173.7, 9.00, 21.34, 4.85),
            (31.1, 16.9, 51.0, 173.7, 8.73, 23.01, 5.49),
            (31.8, 18.0, 56.0, 151.2, 8.82, 24.27, 5.61),
            (32.0, 18.6, 62.0, 120.1, 9.12, 25.10, 5.55),
        ]
    },
    'CONTULMO (Chile)': {
        'lat': -38.03, 'elev': 30,
        'data': [
            (26.2, 10.1, 71.0, 138.2, 9.05, 24.44, 4.11),
            (25.7,  9.8, 74.2, 138.2, 7.58, 20.42, 3.40),
            (23.5,  9.0, 76.8, 138.2, 6.27, 15.73, 2.49),
            (20.1,  7.6, 79.8, 138.2, 4.53, 10.54, 1.58),
            (15.9,  6.4, 85.1, 138.2, 2.81,  6.61, 0.92),
            (13.5,  5.3, 86.2, 138.2, 2.24,  5.19, 0.68),
            (13.6,  4.8, 85.9, 138.2, 2.58,  5.86, 0.71),
            (15.0,  4.9, 83.1, 138.2, 2.96,  7.91, 1.02),
            (17.3,  5.4, 80.1, 138.2, 3.97, 11.55, 1.57),
            (19.7,  6.5, 78.1, 138.2, 4.79, 15.36, 2.24),
            (21.6,  7.9, 74.7, 138.2, 6.29, 19.67, 3.07),
            (23.8,  9.1, 73.2, 138.2, 7.15, 21.97, 3.63),
        ]
    },
    'URANDANGIE (Australia)': {
        'lat': -21.60, 'elev': 175,
        'data': [
            (39.2, 23.8, 37.2, 337.0, 9.20, 25.23, 9.18),
            (37.8, 23.3, 44.5, 319.7, 8.75, 23.76, 8.15),
            (35.9, 21.0, 39.5, 337.0, 9.07, 22.44, 7.94),
            (32.5, 16.6, 36.9, 345.6, 9.75, 20.63, 6.91),
            (27.9, 12.1, 41.8, 337.0, 9.43, 17.51, 5.16),
            (24.9,  8.2, 45.0, 328.3, 9.31, 15.99, 4.10),
            (24.5,  6.6, 42.9, 319.7, 9.74, 17.04, 4.00),
            (27.3,  8.5, 33.6, 371.5, 10.36, 20.09, 5.44),
            (31.5, 12.7, 28.5, 414.7, 10.31, 22.94, 7.36),
            (35.6, 17.3, 28.6, 423.4, 10.10, 25.00, 8.99),
            (38.1, 20.2, 27.7, 406.1, 9.89, 25.97, 9.90),
            (39.4, 22.5, 32.6, 362.9, 9.70, 26.11, 9.68),
        ]
    },
    'WICHITA (USA)': {
        'lat': 37.65, 'elev': 409,
        'data': [
            ( 4.3, -7.1, 75.3, 475.2, 6.15,  9.52, 0.91),
            ( 7.7, -4.6, 65.9, 492.5, 6.65, 12.37, 1.55),
            (14.0,  0.9, 58.7, 553.0, 7.43, 16.30, 2.78),
            (20.2,  6.9, 61.5, 544.3, 8.59, 20.54, 3.93),
            (24.9, 12.4, 62.8, 483.8, 9.34, 23.23, 4.95),
            (30.4, 18.1, 62.3, 466.6, 10.16, 24.96, 6.26),
            (33.8, 21.1, 58.3, 440.6, 11.03, 25.84, 7.30),
            (32.6, 19.9, 57.3, 423.4, 9.97, 22.98, 6.75),
            (27.4, 15.1, 70.5, 449.3, 8.18, 18.19, 4.36),
            (21.4,  8.1, 60.3, 466.6, 7.30, 14.08, 3.58),
            (12.9,  1.1, 71.6, 475.2, 5.67,  9.71, 1.77),
            ( 6.1, -5.0, 78.3, 475.2, 5.44,  8.21, 0.93),
        ]
    },
}


def run_validation():
    print("=" * 90)
    print("  VALIDACIÓN: penman_monteith() vs CROPWAT 8.0")
    print("  Datos: capeta_pruebas/*.pen  |  4 estaciones, 48 meses")
    print("=" * 90)

    total_points = 0
    total_green = 0
    total_yellow = 0
    total_orange = 0
    total_red = 0
    all_diffs = []
    station_summaries = []

    for station_name, station in STATIONS.items():
        lat = station['lat']
        elev = station['elev']
        data = station['data']

        print(f"\n{'─' * 90}")
        print(f"  📍 {station_name}  |  Lat: {lat}°  |  Altitud: {elev} m")
        print(f"{'─' * 90}")
        print(f"  {'Mes':<12} | {'CROPWAT':<8} | {'FAO-56':<8} | {'Δ (sunshine)':<12} | "
              f"{'FAO-56 Rs':<10} | {'Δ (Rs)':<10} | {'Semáforo'}")
        print(f"  {'-' * 84}")

        station_diffs_sun = []
        station_diffs_rs = []

        for i, row in enumerate(data):
            tmax, tmin, rh, wind_kmday, sun_h, rs_mj, eto_cropwat = row
            doy = DAYS_OF_YEAR[i]

            # CROPWAT usa viento en km/día → convertir a m/s
            u2 = wind_kmday / 86.4  # 1 m/s = 86.4 km/día

            # ═══════════════════════════════════════════
            # Test 1: Usando horas de sol (como CROPWAT)
            # ═══════════════════════════════════════════
            eto_fao56_sun = ETOFormulas.penman_monteith(
                temp_max=tmax,
                temp_min=tmin,
                humidity=rh,
                wind_speed=u2,
                latitude=lat,
                day_of_year=doy,
                elevation=elev,
                sunshine_hours=sun_h,
            )

            # ═══════════════════════════════════════════
            # Test 2: Usando Rs directa de CROPWAT
            # ═══════════════════════════════════════════
            eto_fao56_rs = ETOFormulas.penman_monteith(
                temp_max=tmax,
                temp_min=tmin,
                humidity=rh,
                wind_speed=u2,
                latitude=lat,
                day_of_year=doy,
                elevation=elev,
                solar_radiation=rs_mj,
            )

            diff_sun = eto_fao56_sun - eto_cropwat
            diff_rs = eto_fao56_rs - eto_cropwat
            abs_diff = abs(diff_rs)

            station_diffs_sun.append(diff_sun)
            station_diffs_rs.append(diff_rs)
            all_diffs.append(abs_diff)
            total_points += 1

            if abs_diff <= 0.10:
                status = "🟢"
                total_green += 1
            elif abs_diff <= 0.30:
                status = "🟡"
                total_yellow += 1
            elif abs_diff <= 0.50:
                status = "🟠"
                total_orange += 1
            else:
                status = "🔴"
                total_red += 1

            print(f"  {MESES[i]:<12} | {eto_cropwat:<8.2f} | {eto_fao56_sun:<8.2f} | "
                  f"{diff_sun:>+8.2f}     | {eto_fao56_rs:<10.2f} | {diff_rs:>+8.2f}   | {status}")

        # Estadísticas de estación
        import statistics
        avg_diff_sun = statistics.mean(station_diffs_sun)
        avg_diff_rs = statistics.mean(station_diffs_rs)
        mae_rs = statistics.mean([abs(d) for d in station_diffs_rs])
        max_diff_rs = max([abs(d) for d in station_diffs_rs])

        print(f"  {'-' * 84}")
        print(f"  Promedio Δ(sunshine): {avg_diff_sun:+.3f} | "
              f"Promedio Δ(Rs): {avg_diff_rs:+.3f} | "
              f"MAE(Rs): {mae_rs:.3f} | Máx |Δ|(Rs): {max_diff_rs:.3f}")
        station_summaries.append((station_name, avg_diff_rs, mae_rs, max_diff_rs))

    # ═══════════════════════════════════════════════════════════════════
    #  RESUMEN GLOBAL
    # ═══════════════════════════════════════════════════════════════════
    import statistics
    overall_mae = statistics.mean(all_diffs)
    overall_max = max(all_diffs)

    print(f"\n{'=' * 90}")
    print(f"  RESUMEN GLOBAL — {total_points} puntos de datos")
    print(f"{'=' * 90}")
    print()
    print(f"  {'Estación':<30} | {'Sesgo medio':>12} | {'MAE':>8} | {'Máx |Δ|':>8}")
    print(f"  {'-' * 65}")
    for name, bias, mae, maxd in station_summaries:
        print(f"  {name:<30} | {bias:>+12.3f} | {mae:>8.3f} | {maxd:>8.3f}")
    print(f"  {'-' * 65}")
    print(f"  {'TOTAL':<30} | {'':>12} | {overall_mae:>8.3f} | {overall_max:>8.3f}")
    print()
    print(f"  Distribución de precisión (usando Rs directa):")
    print(f"    🟢 ≤0.10 mm/día:  {total_green:>3}/{total_points} ({total_green/total_points*100:.0f}%)")
    print(f"    🟡 ≤0.30 mm/día:  {total_yellow:>3}/{total_points} ({total_yellow/total_points*100:.0f}%)")
    print(f"    🟠 ≤0.50 mm/día:  {total_orange:>3}/{total_points} ({total_orange/total_points*100:.0f}%)")
    print(f"    🔴 >0.50 mm/día:  {total_red:>3}/{total_points} ({total_red/total_points*100:.0f}%)")
    print()

    if overall_mae < 0.15:
        print("  ✅ La implementación FAO-56 pura es altamente consistente con CROPWAT 8.0")
    elif overall_mae < 0.30:
        print("  ⚠️  Diferencias menores detectadas (esperables por diferencias de implementación)")
    else:
        print("  ❌ Diferencias significativas detectadas")

    print(f"\n  NOTA: Las diferencias entre FAO-56 puro y CROPWAT son esperables porque")
    print(f"  CROPWAT aplica ajustes propietarios internos (ver documentación previa).")
    print(f"{'=' * 90}")


if __name__ == '__main__':
    run_validation()
