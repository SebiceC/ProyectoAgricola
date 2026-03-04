import math
from typing import Dict, List, Tuple
from datetime import date

class ETOFormulas:
    """Colección de fórmulas para calcular evapotranspiracion de referencia"""

    # 🟢 FUENTE ÚNICA DE VERDAD: Definimos los nombres aquí
    METHOD_LABELS = {
        'PENMAN': 'Penman-Monteith (FAO-56)',
        'HARGREAVES': 'Hargreaves-Samani',
        'TURC': 'Turc (Zonas Húmedas)',
        'MAKKINK': 'Makkink (Radiación)',
        'MAKKINK_ABSTEW': 'Makkink-Abstew (Calibrado)',
        'PRIESTLEY': 'Priestley-Taylor (Sin Viento)',
        'IVANOV': 'Ivanov (Humedad y Temp)',
        'CHRISTIANSEN': 'Christiansen (Datos Completos)',
        'SIMPLE_ABSTEW': 'Simple Abstew'
    }

    @classmethod
    def get_choices(cls) -> List[Tuple[str, str]]:
        """Devuelve una lista de tuplas para usar en Django Models choices"""
        return [(k, v) for k, v in cls.METHOD_LABELS.items()]

    @classmethod
    def get_label(cls, key: str) -> str:
        """Devuelve el nombre legible de una fórmula"""
        return cls.METHOD_LABELS.get(key, key)

    @staticmethod
    def penman_monteith(
        temp_max: float,
        temp_min: float,
        humidity: float,
        wind_speed: float,
        latitude: float,
        day_of_year: int,
        elevation: float = 0,
        pressure: float = None,
        sunshine_hours: float = None,
        solar_radiation: float = None,
        rh_max: float = None,
        rh_min: float = None,
        temp_dew: float = None,
        g_monthly: float = None,
        a_s: float = None,
        b_s: float = None,
        wind_z_height: float = 2.0) -> float:
        """
        Ecuación FAO Penman-Monteith — Réplica EXACTA de FAO-56
        =========================================================
        Implementación fiel de la ecuación de Penman-Monteith tal como se define
        en el documento FAO Irrigation and Drainage Paper No. 56:

            Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998).
            "Crop evapotranspiration - Guidelines for computing crop water
            requirements." FAO Irrigation and Drainage Paper 56. FAO, Rome.

        ECUACIÓN PRINCIPAL (Eq. 6, Cap. 2, p. 24):
        ┌─────────────────────────────────────────────────────────────────┐
        │         0.408 Δ (Rn - G) + γ [900/(T+273)] u₂ (eₛ - eₐ)         │
        │  ETo = ─────────────────────────────────────────────────────    │
        │                   Δ + γ (1 + 0.34 u₂)                           │
        └─────────────────────────────────────────────────────────────────┘

        Cada paso está anotado con su número de ecuación FAO-56 exacto.

        Parámetros
        ----------
        temp_max : float          Temperatura máxima diaria [°C]
        temp_min : float          Temperatura mínima diaria [°C]
        humidity : float          Humedad relativa media [%] (RHmean, usada si no hay rh_max/rh_min)
        wind_speed : float        Velocidad del viento a 2 m [m/s]
        latitude : float          Latitud [grados decimales, + Norte, - Sur]
        day_of_year : int         Día juliano del año [1-365/366]
        elevation : float         Altitud sobre el nivel del mar [m]
        pressure : float          Presión atmosférica [kPa] (opcional, si None se calcula con Eq 7)
        sunshine_hours : float    Horas de brillo solar [h/día] (opcional)
        solar_radiation : float   Radiación solar Rs medida [MJ m⁻² día⁻¹] (opcional)
        rh_max : float            Humedad relativa máxima [%] (opcional, para Eq 17)
        rh_min : float            Humedad relativa mínima [%] (opcional, para Eq 17)
        temp_dew : float          Temperatura del punto de rocío [°C] (opcional, para Eq 14)
        g_monthly : float         Flujo de calor del suelo mensual [MJ m⁻² día⁻¹] (opcional)
        a_s : float               Fracción extraterrestre en días nublados (opcional, Eq 35/36)
        b_s : float               Fracción extraterrestre en días despejados (opcional, Eq 35/36)
        wind_z_height : float     Altura de medición del anemómetro [m] (defecto=2.0, Eq 47)

        Retorna
        -------
        float : ETo [mm/día]

        Referencias FAO-56
        ------------------
        Capítulo 2: Ecuación FAO Penman-Monteith (Eq. 6)
        Capítulo 3: Datos meteorológicos (Eq. 7-44)
        Capítulo 4: Determinación de ETo (Box 11, Examples 17-20)
        """

        # ════════════════════════════════════════════════════════════════
        # PASO 1: TEMPERATURA MEDIA (Cap. 3)
        # ════════════════════════════════════════════════════════════════
        # Tmean = (Tmax + Tmin) / 2
        temp_mean = (temp_max + temp_min) / 2.0

        # ════════════════════════════════════════════════════════════════
        # PASO 2: PRESIÓN ATMOSFÉRICA Y CONSTANTE PSICROMÉTRICA
        # ════════════════════════════════════════════════════════════════

        # ▸ Eq. 7 — Presión atmosférica [kPa]
        # P = 101.3 × [(293 - 0.0065 z) / 293]^5.26
        if pressure is not None and pressure > 0:
            P = pressure
        else:
            P = 101.3 * ((293.0 - 0.0065 * elevation) / 293.0) ** 5.26

        # ▸ Eq. 8 — Constante psicrométrica [kPa/°C]
        # γ = (cp × P) / (ε × λ) = 0.000665 × P
        # donde cp=1.013×10⁻³ MJ kg⁻¹ °C⁻¹, ε=0.622, λ=2.45 MJ kg⁻¹
        gamma = 0.000665 * P

        # ════════════════════════════════════════════════════════════════
        # PASO 3: PENDIENTE DE LA CURVA DE PRESIÓN DE VAPOR (Δ)
        # ════════════════════════════════════════════════════════════════

        # ▸ Eq. 13 — Pendiente evaluada en Tmean [kPa/°C]
        # Δ = [4098 × 0.6108 × exp(17.27T / (T+237.3))] / (T+237.3)²
        delta = (4098.0 * (0.6108 * math.exp(
            (17.27 * temp_mean) / (temp_mean + 237.3)
        ))) / ((temp_mean + 237.3) ** 2)

        # ════════════════════════════════════════════════════════════════
        # PASO 4: PRESIÓN DE VAPOR DE SATURACIÓN (es) Y REAL (ea)
        # ════════════════════════════════════════════════════════════════

        # ▸ Eq. 11 — Presión de vapor de saturación a temperatura T [kPa]
        # e°(T) = 0.6108 × exp[17.27 T / (T + 237.3)]
        def sat_vap_pressure(T: float) -> float:
            """FAO-56 Eq. 11"""
            return 0.6108 * math.exp((17.27 * T) / (T + 237.3))

        e_tmax = sat_vap_pressure(temp_max)
        e_tmin = sat_vap_pressure(temp_min)

        # ▸ Eq. 12 — Presión media de vapor de saturación [kPa]
        # es = [e°(Tmax) + e°(Tmin)] / 2
        es = (e_tmax + e_tmin) / 2.0

        # ▸ Presión de vapor real (ea) — Jerarquía FAO-56:
        #   1. Tdew (Eq. 14):           ea = e°(Tdew)
        #   2. RHmax + RHmin (Eq. 17):  ea = [e°(Tmin)×RHmax/100 + e°(Tmax)×RHmin/100] / 2
        #   3. RHmax sola (Eq. 18):     ea = e°(Tmin) × RHmax/100
        #   4. RHmean (Eq. 19):         ea = es × RHmean/100  (menos recomendada)

        if temp_dew is not None:
            # Eq. 14 — ea desde punto de rocío
            ea = sat_vap_pressure(temp_dew)
        elif rh_max is not None and rh_min is not None:
            # Eq. 17 — ea desde RHmax y RHmin
            ea = (e_tmin * (rh_max / 100.0) + e_tmax * (rh_min / 100.0)) / 2.0
        elif rh_max is not None:
            # Eq. 18 — ea solo desde RHmax
            ea = e_tmin * (rh_max / 100.0)
        else:
            # Eq. 19 — ea desde RHmean (menos recomendada por FAO-56 p.37)
            ea = es * (humidity / 100.0)

        # ▸ Déficit de presión de vapor [kPa]
        vpd = es - ea

        # ════════════════════════════════════════════════════════════════
        # PASO 5: RADIACIÓN
        # ════════════════════════════════════════════════════════════════

        # ▸ Eq. 22 — Latitud en radianes
        lat_rad = math.radians(latitude)

        # ▸ Eq. 24 — Declinación solar [rad]
        # δ = 0.409 sin(2π/365 × J - 1.39)
        sol_dec = 0.409 * math.sin((2.0 * math.pi / 365.0) * day_of_year - 1.39)

        # ▸ Eq. 25 — Ángulo horario de puesta del sol [rad]
        # ωs = arccos[-tan(φ) tan(δ)]
        ws_arg = -math.tan(lat_rad) * math.tan(sol_dec)
        ws_arg = max(-1.0, min(1.0, ws_arg))  # Protección polar
        ws = math.acos(ws_arg)

        # ▸ Eq. 23 — Distancia relativa inversa Tierra-Sol
        # dr = 1 + 0.033 cos(2π/365 × J)
        dr = 1.0 + 0.033 * math.cos((2.0 * math.pi / 365.0) * day_of_year)

        # ▸ Eq. 21 — Radiación extraterrestre [MJ m⁻² día⁻¹]
        # Ra = (24×60/π) × Gsc × dr × [ωs sin(φ)sin(δ) + cos(φ)cos(δ)sin(ωs)]
        # donde Gsc = 0.0820 MJ m⁻² min⁻¹
        Gsc = 0.0820
        Ra = (24.0 * 60.0 / math.pi) * Gsc * dr * (
            ws * math.sin(lat_rad) * math.sin(sol_dec) +
            math.cos(lat_rad) * math.cos(sol_dec) * math.sin(ws)
        )

        # ▸ Eq. 34 — Horas máximas de insolación (duración del día) [h]
        # N = (24/π) × ωs
        N = (24.0 / math.pi) * ws

        # ▸ Radiación solar Rs [MJ m⁻² día⁻¹]
        if solar_radiation is not None:
            # Rs medida directamente
            Rs = solar_radiation
        elif sunshine_hours is not None:
            # Eq. 35 — Fórmula de Ångström: Rs = (as + bs × n/N) × Ra
            # Coeficientes recomendados FAO-56 si no hay calibración: as = 0.25, bs = 0.50
            calc_as = a_s if a_s is not None else 0.25
            calc_bs = b_s if b_s is not None else 0.50
            Rs = (calc_as + calc_bs * (sunshine_hours / N)) * Ra
        else:
            raise ValueError(
                "Se requiere 'solar_radiation' (Rs medida) o "
                "'sunshine_hours' (horas de sol) para calcular Rs."
            )

        # ▸ Radiación de cielo despejado (Rso) [MJ m⁻² día⁻¹]
        if a_s is not None and b_s is not None:
            # Eq. 36 — Si se cuenta con valores calibrados de as y bs
            Rso = (a_s + b_s) * Ra
        else:
            # Eq. 37 — Si no se cuenta con valores calibrados
            Rso = (0.75 + 2e-5 * elevation) * Ra

        # ▸ Eq. 38 — Radiación neta de onda corta [MJ m⁻² día⁻¹]
        # Rns = (1 - α) × Rs   donde α = 0.23 (pasto de referencia)
        Rns = (1.0 - 0.23) * Rs

        # ▸ Eq. 39 — Radiación neta de onda larga [MJ m⁻² día⁻¹]
        # Rnl = σ × [(Tmax,K⁴ + Tmin,K⁴)/2] × (0.34 - 0.14√ea) × (1.35 Rs/Rso - 0.35)
        # donde σ = 4.903 × 10⁻⁹ MJ K⁻⁴ m⁻² día⁻¹
        sigma = 4.903e-9
        tmax_k = temp_max + 273.16
        tmin_k = temp_min + 273.16

        rs_rso = Rs / Rso if Rso > 0 else 0.0
        rs_rso = min(rs_rso, 1.0)  # FAO-56: Rs/Rso ≤ 1.0

        Rnl = sigma * ((tmax_k**4 + tmin_k**4) / 2.0) * \
              (0.34 - 0.14 * math.sqrt(ea)) * \
              (1.35 * rs_rso - 0.35)

        # ▸ Eq. 40 — Radiación neta [MJ m⁻² día⁻¹]
        # Rn = Rns - Rnl
        Rn = Rns - Rnl

        # ════════════════════════════════════════════════════════════════
        # PASO 6: FLUJO DE CALOR DEL SUELO (G)
        # ════════════════════════════════════════════════════════════════

        # ▸ Eq. 42 — Para períodos diarios: G ≈ 0
        # ▸ Eq. 43 — Para períodos mensuales: G = 0.14 × (Ti - Ti-1)
        if g_monthly is not None:
            G = g_monthly
        else:
            G = 0.0  # Asunción diaria estándar FAO-56

        # ════════════════════════════════════════════════════════════════
        # PASO 6.5: AJUSTE DE VELOCIDAD DEL VIENTO A 2M (Eq. 47)
        # ════════════════════════════════════════════════════════════════
        
        # ▸ Eq. 47 — Conversión de velocidad de viento a altura estándar (2m)
        if wind_z_height != 2.0:
            u2 = wind_speed * (4.87 / math.log(67.8 * wind_z_height - 5.42))
        else:
            u2 = wind_speed

        # ════════════════════════════════════════════════════════════════
        # PASO 7: ECUACIÓN FAO PENMAN-MONTEITH (Eq. 6)
        # ════════════════════════════════════════════════════════════════

        # Numerador: 0.408 Δ (Rn - G)  +  γ × [900/(Tmean+273)] × u₂ × (es - ea)
        term_rad = 0.408 * delta * (Rn - G)
        term_aero = gamma * (900.0 / (temp_mean + 273.0)) * u2 * vpd

        # Denominador: Δ + γ (1 + 0.34 u₂)
        denominator = delta + gamma * (1.0 + 0.34 * u2)

        eto = (term_rad + term_aero) / denominator

        return round(max(0.0, eto), 2)
    
    @staticmethod
    def hargreaves(temp_max: float, temp_min: float, temp_avg: float, latitude: float, day_of_year: int) -> float:
        """
        Hargreaves-Samani (1985)
        Unidades de salida: mm/día
        """
        # 1. Latitud a radianes
        lat_rad = math.radians(latitude)

        # 2. Declinación solar
        delta = 0.409 * math.sin(2 * math.pi * day_of_year / 365 - 1.39)

        # 3. Ángulo horario de puesta del sol
        ws_val = -math.tan(lat_rad) * math.tan(delta)
        # Protección matemática para zonas polares (no es tu caso, pero es buena práctica)
        ws_val = max(-1, min(1, ws_val)) 
        ws = math.acos(ws_val)

        # 4. Distancia relativa Tierra-Sol
        dr = 1 + 0.033 * math.cos(2 * math.pi * day_of_year / 365)

        # 5. Radiación Extraterrestre (Ra) en MJ/m2/día
        # Constante solar Gsc = 0.0820 MJ/m2/min
        Ra = (24 * 60 / math.pi) * 0.0820 * dr * (
            (ws * math.sin(lat_rad) * math.sin(delta)) + 
            (math.cos(lat_rad) * math.cos(delta) * math.sin(ws))
        )

        # 6. Fórmula Hargreaves-Samani
        # 🟢 CORRECCIÓN CRÍTICA: Multiplicar por 0.408 para convertir MJ a mm
        eto = 0.0023 * (temp_avg + 17.8) * math.sqrt(temp_max - temp_min) * Ra * 0.408

        return round(max(0, eto), 2)

    @staticmethod
    def turc(temp_avg: float, humidity: float, radiation: float) -> float:
        """
        Formula de Turc
        """
        # Nota: radiation debe estar en MJ/m2/dia (o calibrar coeficientes si es Cal/cm2)
        # Coeficiente 23.8856 asume radiación en MJ
        if humidity >= 50:
            eto = 0.013 * (temp_avg / (temp_avg + 15)) * (23.8856 * radiation + 50)
        else:
            eto = 0.013 * (temp_avg / (temp_avg + 15)) * (23.8856 * radiation + 50) * (1 + (50 - humidity) / 70)
        
        return round(max(0, eto), 2)

    @staticmethod
    def makkink(temp_avg: float, radiation: float, elevation: float = 0) -> float:
        """
        Formula de Makkink (1957)
        """
        # Presion atmosferica
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26

        # Constante psicrometrica (Corregida también aquí por seguridad)
        gamma = 0.000665 * P

        # Pendiente de la curva de presion de vapor
        delta = 4098 * (0.6108 * math.exp(17.27 * temp_avg / (temp_avg + 237.3))) / ((temp_avg + 237.3) ** 2)

        # Formula de Makkink
        eto = 0.61 * (delta / (delta + gamma)) * (radiation / 2.45) - 0.12

        return round(max(0, eto), 2)


    @staticmethod
    def makkink_abstew(temp_avg: float, radiation: float, elevation: float = 0) -> float:
        """
        Fórmula Makkink-Abstew
        Versión modificada de Makkink calibrada por Abstew
        """
        # Presión atmosférica
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
        
        # Constante psicrométrica
        gamma = 0.000665 * P
        
        # Pendiente de la curva de presión de vapor
        delta = 4098 * (0.6108 * math.exp(17.27 * temp_avg / (temp_avg + 237.3))) / ((temp_avg + 237.3) ** 2)
        
        # Fórmula Makkink-Abstew (coeficientes calibrados)
        eto = 0.65 * (delta / (delta + gamma)) * (radiation / 2.45) - 0.05
        
        return round(max(0, eto), 2)
    
    @staticmethod
    def simple_abstew(temp_max: float, temp_min: float, radiation: float) -> float:
        """
        Simple Abstew (1996)
        """
        # Temperatura promedio
        temp_avg = (temp_max + temp_min) / 2
        
        # Rango de temperatura diario
        temp_range = temp_max - temp_min
        
        # Fórmula Simple Abstew
        eto = 0.0031 * (temp_avg + 17.8) * math.sqrt(temp_range) * radiation / 2.45
        
        return round(max(0, eto), 2)
    
    @staticmethod
    def priestley_taylor(temp_avg: float, radiation: float, elevation: float = 0) -> float:
        """
        Formula de Priestley-Taylor
        """
        # Similar a Makkink pero con coeficiente diferente
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26

        # Constante psicrometrica
        gamma = 0.000665 * P

        # Pendiente de la curva de presion de vapor
        delta = 4098 * (0.6108 * math.exp(17.27 * temp_avg / (temp_avg + 237.3))) / ((temp_avg + 237.3) ** 2)

        # Radiacion neta (aproximada)
        Rn = radiation * 0.77

        # Formula de Priestley-Taylor
        eto = 1.26 * (delta / (delta + gamma)) * (Rn / 2.45)

        return round(max(0, eto), 2)


    @staticmethod
    def ivanov(temp_avg: float, humidity: float) -> float:
        """
        Fórmula de Ivanov (1954)
        """
        # Verificar que la temperatura sea positiva
        if temp_avg <= 0:
            return 0
        
        # Fórmula de Ivanov
        # Factor de corrección por humedad
        humidity_factor = (100 - humidity) / 100
        
        # Cálculo base de Ivanov
        eto = 0.0018 * (temp_avg + 25) ** 2 * humidity_factor
        
        return round(max(0, eto), 2)
    
    @staticmethod
    def christiansen(temp_max: float, temp_min: float, humidity: float, 
                    wind_speed: float, radiation: float, latitude: float, 
                    day_of_year: int, elevation: float = 0) -> float:
        """
        Fórmula de Christiansen
        """
        # Temperatura promedio
        temp_avg = (temp_max + temp_min) / 2
        
        # Presión atmosférica
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
        
        # Constante psicrométrica
        gamma = 0.000665 * P
        
        # Pendiente de la curva de presión de vapor
        delta = 4098 * (0.6108 * math.exp(17.27 * temp_avg / (temp_avg + 237.3))) / ((temp_avg + 237.3) ** 2)
        
        # Presión de vapor de saturación
        es = 0.6108 * math.exp(17.27 * temp_avg / (temp_avg + 237.3))
        
        # Presión de vapor actual
        ea = es * humidity / 100
        
        # Déficit de presión de vapor
        vpd = es - ea
        
        # Factor de radiación
        radiation_factor = radiation / 15.39  # Normalización
        
        # Factor de viento (Christiansen usa una función específica)
        wind_factor = 0.27 * (1 + wind_speed / 3.0)
        
        # Factor de temperatura
        temp_factor = (temp_avg + 17.8) / 21.1
        
        # Fórmula de Christiansen
        # Combina radiación, temperatura, viento y humedad con pesos específicos
        eto = (0.37 * radiation_factor * temp_factor + 
               0.63 * wind_factor * vpd) * (delta / (delta + gamma))
        
        return round(max(0, eto), 2)

    @staticmethod
    def get_formula_requirements() -> Dict[str, list]:
        """
        Retorna los parámetros requeridos para cada fórmula
        """
        return {
            'makkink-abstew': ['temp_avg', 'radiation', 'elevation'],
            'simple-abstew': ['temp_max', 'temp_min', 'radiation'],
            'ivanov': ['temp_avg', 'humidity'],
            'christiansen': ['temp_max', 'temp_min', 'humidity', 'wind_speed', 
                           'radiation', 'latitude', 'day_of_year', 'elevation']
        }
    
    @staticmethod
    def validate_inputs(method: str, **kwargs) -> tuple[bool, str]:
        """
        Valida que se tengan todos los inputs necesarios para una fórmula
        """
        requirements = ETOFormulas.get_formula_requirements()
        
        if method not in requirements:
            return False, f"Método {method} no encontrado"
        
        required_params = requirements[method]
        missing_params = []
        
        for param in required_params:
            if param not in kwargs or kwargs[param] is None:
                missing_params.append(param)
        
        if missing_params:
            return False, f"Faltan parámetros: {', '.join(missing_params)}"
        
        # Validaciones específicas
        if method == 'ivanov' and kwargs.get('temp_avg', 0) <= -25:
            return False, "Temperatura muy baja para fórmula Ivanov"
        
        if 'humidity' in kwargs and not (0 <= kwargs['humidity'] <= 100):
            return False, "Humedad debe estar entre 0 y 100%"
        
        if 'wind_speed' in kwargs and kwargs['wind_speed'] < 0:
            return False, "Velocidad del viento no puede ser negativa"
        
        return True, "OK"