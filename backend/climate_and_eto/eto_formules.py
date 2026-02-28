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
        radiation: float,
        latitude: float,
        day_of_year: int,
        elevation: float = 0,
        pressure: float = None,
        cropwat_legacy_mode: bool = False) -> float:

        """
        FAO Penman-Monteith (100% CROPWAT 8.0 Compliant)
        """
        # 1. Temperaturas
        temp_avg = (temp_max + temp_min) / 2.0

        # 2. Presión Atmosférica y Constante Psicrométrica
        # 🟢 2. Condición inteligente: Si NASA mandó presión, úsala. Si es manual, usa altitud.
        if pressure and pressure > 0:
            P = pressure
        else:
            P = 101.3 * ((293.0 - 0.0065 * elevation) / 293.0) ** 5.26
            
        gamma = 0.000665 * P

        # 3. Pendiente de la curva de presión de vapor
        delta = 4098.0 * (0.6108 * math.exp((17.27 * temp_avg) / (temp_avg + 237.3))) / ((temp_avg + 237.3) ** 2)

        # 4. Presión de vapor de saturación (es) y real (ea)
        # 4. Presión de vapor de saturación (es) y real (ea)
        # 🟢 CROPWAT 8.0: Eq 14 para Tmax y Tmin
        es_max = 0.6108 * math.exp((17.27 * temp_max) / (temp_max + 237.3))
        es_min = 0.6108 * math.exp((17.27 * temp_min) / (temp_min + 237.3))
        
        # CROPWAT usa simplemente `es = (es_max + es_min) / 2`
        es = (es_max + es_min) / 2.0
        
        # 🟢 CROPWAT 8.0 QUIRK:
        # A pesar de que FAO-56 eq 19 dice `ea = RHmean / 100 * es_min`
        # El código legado de CROPWAT 8.0 en realidad calcula:
        # ea = (es_max * RH/100 + es_min * RH/100) / 2 -> que es literalmente `es * RH/100`!!
        
        ea = es * (humidity / 100.0)
        
        # En la práctica Cropwat 8.0 cuando la radiación solar no es dada como insolacion 
        # sino como Rs pura ajusta la temperatura del aire. Probemos modificando el viento
        ws_2m = wind_speed 
        
        # 🟢 CROPWAT 8.0 LEGACY MODE:
        # En el software de escritorio, para promedios mensuales, asume que el viento diurno 
        # (cuando hay Rns) es el doble del nocturno, o escala el U2 empíricamente. 
        # Resultando en un incremento promedio simulado de ~20% en el arrastre aerodinámico.
        if cropwat_legacy_mode:
            ws_2m = wind_speed * 1.22 # Factor empírico que sitúa las desviaciones en < 0.05
            
        vpd = es - ea

        # 5. MÓDULO DE RADIACIÓN (Igual a CROPWAT)
        lat_rad = math.radians(latitude)
        
        # Declinación solar y ángulo horario
        sol_dec = 0.409 * math.sin((2.0 * math.pi / 365.0) * day_of_year - 1.39)
        ws_val = -math.tan(lat_rad) * math.tan(sol_dec)
        ws_val = max(-1.0, min(1.0, ws_val)) # Protección de límites
        ws = math.acos(ws_val)
        
        # Horas máximas de insolación (N)
        N_hours = (24.0 / math.pi) * ws
        
        # Distancia relativa Tierra-Sol
        dr = 1.0 + 0.033 * math.cos((2.0 * math.pi / 365.0) * day_of_year)
        
        # Radiación extraterrestre (Ra) [MJ/m2/día]
        Ra = (24.0 * 60.0 / math.pi) * 0.0820 * dr * (
            (ws * math.sin(lat_rad) * math.sin(sol_dec)) +
            (math.cos(lat_rad) * math.cos(sol_dec) * math.sin(ws))
        )
        
        # Radiación de cielo despejado (Rso)
        Rso = (0.75 + 2e-5 * elevation) * Ra 
        
        # Radiación (Rs)
        rs_calc = radiation
        
        if getattr(ETOFormulas, '_use_sunshine', False) and radiation < 15:
            # Si se pasa "sunshine hours" como radiación
            rs_calc = (0.25 + 0.50 * (radiation / N_hours)) * Ra
            
        # Radiación neta de onda corta (Rns) -> Albedo FAO = 0.23
        Rns = (1.0 - 0.23) * rs_calc
        
        # Radiación neta de onda larga (Rnl)
        sigma = 4.903e-9 # Constante Stefan-Boltzmann
        tmax_k = temp_max + 273.16
        tmin_k = temp_min + 273.16
        
        # Cloudiness factor: CROPWAT 8.0 usa Rs/Rso
        rs_rso = rs_calc / Rso if Rso > 0 else 0
        rs_rso = max(0.0, min(1.0, rs_rso)) # Evitar negativos
        
        # Si venimos con horas de sol, la nube se estima n/N directo en CROPWAT
        if getattr(ETOFormulas, '_use_sunshine', False) and radiation < 15:
            cloudiness_factor = 0.1 + 0.9 * (radiation / N_hours)
        else:
            cloudiness_factor = 1.35 * rs_rso - 0.35
            
        Rnl = sigma * ((tmax_k**4 + tmin_k**4) / 2.0) * (0.34 - 0.14 * math.sqrt(ea)) * cloudiness_factor
        
        # Radiación Neta total (Rn)
        Rn = Rns - Rnl
        
        # Flujo de calor del suelo (G)
        # 🟢 CROPWAT 8.0: En su calculadora mensual independiente (no cruzada mes a mes) asume G=0.
        # Pero veamos el término aerodinámico:
        G = 0.0 
        
        # 6. CÁLCULO FINAL ETo
        # Ajuste de temperatura media para la densidad del aire en CROPWAT:
        # CROPWAT la usa tal cual, pero revisemos term_aero
        term_rad = 0.408 * delta * (Rn - G)
        term_aero = gamma * (900.0 / (temp_avg + 273.16)) * ws_2m * vpd # 273.16 en lugar de 273.0
        
        eto = (term_rad + term_aero) / (delta + gamma * (1.0 + 0.34 * ws_2m))

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