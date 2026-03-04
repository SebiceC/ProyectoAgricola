"""
Verificación de la función penman_monteith()
===================================================
Reproduce el EXAMPLE 17 del documento FAO-56 (Allen et al., 1998, p. 69-72):
    Bangkok, Tailandia — Abril
    Latitud: 13°44'N (13.73°)  |  Altitud: 2 m

Resultado esperado FAO-56: ETo = 5.72 mm/día (redondeado a 5.7)

Fuente: Cap. 4, Box 11 — "Determination of ETo with mean monthly data"
"""

import sys
sys.path.append('/home/sececa/portfolioProyects/ProyectoAgricola/backend')
from climate_and_eto.eto_formules import ETOFormulas

# ═══════════════════════════════════════════════════════════════════
#  DATOS DEL EXAMPLE 17 — FAO-56, Cap. 4, p. 69
# ═══════════════════════════════════════════════════════════════════
# Bangkok (Thailand), Abril, 13°44'N, z = 2 m
LATITUDE = 13.73        # 13°44'N => 13 + 44/60 = 13.7333...
ELEVATION = 2           # metros
DAY_OF_YEAR = 105       # 15 de Abril (Table 2.5)
TMAX = 34.8             # °C
TMIN = 25.6             # °C
EA_GIVEN = 2.85         # kPa (dato directo, como Tdew implícito)
U2 = 2.0                # m/s
SUNSHINE_HOURS = 8.5    # horas/día
G_MONTHLY = 0.14        # MJ m⁻² día⁻¹  [0.14 × (30.2 - 29.2)]

# Resultado oficial FAO-56:
ETO_EXPECTED = 5.72     # mm/día (antes de redondeo final a 5.7)

# ═══════════════════════════════════════════════════════════════════
#  VALORES INTERMEDIOS ESPERADOS (del Example 17)
# ═══════════════════════════════════════════════════════════════════
EXPECTED = {
    'Tmean':      30.2,       # (34.8 + 25.6) / 2
    'P':          101.3,      # kPa (a 2 m de altitud ≈ nivel del mar)
    'gamma':      0.0674,     # kPa/°C
    'delta':      0.246,      # kPa/°C
    'e_tmax':     5.56,       # kPa  e°(34.8)
    'e_tmin':     3.28,       # kPa  e°(25.6)
    'es':         4.42,       # kPa
    'vpd':        1.57,       # kPa (4.42 - 2.85)
    'Ra':         38.06,      # MJ m⁻² día⁻¹
    'N':          12.31,      # horas
    'Rs':         22.65,      # MJ m⁻² día⁻¹
    'Rso':        28.54,      # MJ m⁻² día⁻¹
    'Rns':        17.44,      # MJ m⁻² día⁻¹
    'Rnl':        3.11,       # MJ m⁻² día⁻¹ (calculado paso a paso)
    'Rn':         14.33,      # MJ m⁻² día⁻¹
    'term_rad':   3.97,       # mm/día  [0.408(Rn-G) × Δ/(Δ+γ(1+0.34u₂))]
    'term_aero':  1.75,       # mm/día  [900/(T+273)×u₂×vpd × γ/(Δ+γ(1+0.34u₂))]
}


def main():
    print("=" * 72)
    print("  VERIFICACIÓN FAO-56 — Example 17 (Bangkok, Abril)")
    print("  Fuente: Allen et al. (1998), Cap. 4, p. 69-72")
    print("=" * 72)
    print()

    # El Example 17 da ea = 2.85 kPa directamente.
    # Para obtener este ea en nuestra función, necesitamos derivar Tdew de ea.
    # ea = e°(Tdew) => Tdew = (237.3 × ln(ea/0.6108)) / (17.27 - ln(ea/0.6108))
    import math
    ln_ratio = math.log(EA_GIVEN / 0.6108)
    tdew = (237.3 * ln_ratio) / (17.27 - ln_ratio)
    print(f"  Tdew derivado de ea = {EA_GIVEN} kPa: {tdew:.2f} °C")
    print()

    # Llamada a la función
    eto = ETOFormulas.penman_monteith(
        temp_max=TMAX,
        temp_min=TMIN,
        humidity=50,           # no importa, se usa temp_dew
        wind_speed=U2,
        latitude=LATITUDE,
        day_of_year=DAY_OF_YEAR,
        elevation=ELEVATION,
        sunshine_hours=SUNSHINE_HOURS,
        temp_dew=tdew,
        g_monthly=G_MONTHLY
    )

    diff = abs(eto - ETO_EXPECTED)
    status = "🟢 PASS" if diff <= 0.1 else "🔴 FAIL"

    print(f"  {'Parámetro':<30} | {'Esperado':<12} | {'Calculado':<12} | {'Estado'}")
    print("  " + "-" * 72)
    print(f"  {'ETo [mm/día]':<30} | {ETO_EXPECTED:<12.2f} | {eto:<12.2f} | {status}")
    print()

    # ═══════════════════════════════════════════════════════════════════
    #  TEST ADICIONAL: Usando RHmean en vez de Tdew (Eq. 19)
    # ═══════════════════════════════════════════════════════════════════
    print("  --- Test con RHmean (Eq. 19) ---")
    # Si ea = 2.85 y es = 4.42, entonces RHmean ≈ ea/es*100 = 64.5%
    rh_mean_approx = (EA_GIVEN / EXPECTED['es']) * 100
    eto_rh = ETOFormulas.penman_monteith(
        temp_max=TMAX,
        temp_min=TMIN,
        humidity=rh_mean_approx,
        wind_speed=U2,
        latitude=LATITUDE,
        day_of_year=DAY_OF_YEAR,
        elevation=ELEVATION,
        sunshine_hours=SUNSHINE_HOURS,
        g_monthly=G_MONTHLY
    )
    print(f"  RHmean = {rh_mean_approx:.1f}%, ETo = {eto_rh:.2f} mm/día")
    print()

    # ═══════════════════════════════════════════════════════════════════
    #  TEST ADICIONAL: Rs directa en vez de horas de sol
    # ═══════════════════════════════════════════════════════════════════
    print("  --- Test con Rs directa ---")
    eto_rs = ETOFormulas.penman_monteith(
        temp_max=TMAX,
        temp_min=TMIN,
        humidity=50,
        wind_speed=U2,
        latitude=LATITUDE,
        day_of_year=DAY_OF_YEAR,
        elevation=ELEVATION,
        solar_radiation=EXPECTED['Rs'],  # 22.65 MJ m⁻² día⁻¹
        temp_dew=tdew,
        g_monthly=G_MONTHLY
    )
    diff_rs = abs(eto_rs - ETO_EXPECTED)
    status_rs = "🟢 PASS" if diff_rs <= 0.1 else "🔴 FAIL"
    print(f"  ETo con Rs directa: {eto_rs:.2f} mm/día ({status_rs})")
    print()

    # ═══════════════════════════════════════════════════════════════════
    #  RESUMEN
    # ═══════════════════════════════════════════════════════════════════
    print("=" * 72)
    all_pass = diff <= 0.1 and diff_rs <= 0.1
    if all_pass:
        print("  ✅ RESULTADO: La implementación es IDÉNTICA a FAO-56")
    else:
        print("  ❌ RESULTADO: Hay diferencias con FAO-56")
    print("=" * 72)

    return 0 if all_pass else 1


if __name__ == '__main__':
    sys.exit(main())
