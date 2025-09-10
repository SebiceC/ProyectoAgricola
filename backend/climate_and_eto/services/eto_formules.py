import math
from typing import Dict, Optional
from datetime import date

class ETOFormulas:
    """Colección de fórmulas para calcular evapotranspiracion de referencia"""

    @staticmethod
    def penman_monteith(
        temp_max: float,
        temp_min: float,
        humidity: float,
        wind_speed: float,
        radiation: float,
        latitude: float,
        day_of_year: int,
        elevation: float = 0) -> float:

        """
        FAO Penman-Monteith fórmula
        Inputs: 
        - temp_max, temp_min: Temperaturas en °C
        - humidity: Humedad relativa en %
        - wind_speed: Velocidad del viento en m/s
        - radiation: Radiación solar en MJ/m²/día
        - latitude: Latitud en grados decimales
        - day_of_year: Día del año (1-365)
        - elevation: Altitud en metros 
        """

        # Temperatura promedio
        temp_avg = (temp_max + temp_min) / 2

        # Presión atmosférica 
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26

        # Constante psicrométrica
        gamma = 0.665 * P

        #Pendiente de la curva de presión de vapor
        delta = 4098 * (0.6108 * math.exp((17.27 * temp_avg) / (temp_avg + 237.3))) / ((temp_avg + 237.3) ** 2)

        # Presion de vapor de saturacion
        es_max = 0.6108 * math.exp((17.27 * temp_max) / (temp_max + 237.3))
        es_min = 0.6108 * math.exp((17.27 * temp_min) / (temp_min + 237.3))
        es = (es_max + es_min) / 2

        # Presion de vapor actual
        ea = es * humidity / 100

        # Deficit de presion de vapor
        vpd = es - ea

        # Radiación neta (simplificada)
        Rn = 0.77 * radiation

        # Flujo de calor del suelo (assumido 0 para periodos diarios)
        G = 0

        #velocidad del viento a 2m
        u2 = wind_speed 

        #Formula FAO Penman-Monteith
        numerator = 0.408 * delta * (Rn - G) + gamma + 900 / (temp_avg + 273) * u2 * vpd
        denominator =  delta + gamma * (1+ 0.32 * u2)

        eto = numerator / denominator

        return round(max(0, eto), 2)

    @staticmethod
    def hargreaves(temp_max: float, temp_min: float, temp_avg: float, latitude: float, day_of_year: int) -> float:
        """
        Hargreaves-Samani (1985) fórmula
        Requiere solo temperaturas y ubicacion
        """

        # Convertir latitud a radianes
        lat_rad = math.radians(latitude)

        # Declinacion solar
        delta = 0.409 * math.sin(2 * math.pi * day_of_year / 365 - 1.39)

        # Angulo horario de puesta del sol
        ws = math.acos(-math.tan(lat_rad) * math.tan(delta))

        # Radiacion extraterrestre 
        dr = 1 + 0.033 * math.cos(2 * math.pi * day_of_year / 365)
        Ra = 24 * 60 / math.pi * 0.082 * dr * (ws * math.sin(lat_rad) * math.sin(delta) + math.cos(lat_rad) * math.cos(delta) * math.sin(ws))

        # Formula Hargreaves-Samani
        eto = 0.0023 * (temp_avg + 17.8) * math.sqrt(temp_max - temp_min) * Ra

        return round(max(0, eto), 2)

    @staticmethod
    def turc(temp_avg: float, humidity: float, radiation: float) -> float:
        """
        Formula de Turc
        """
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

        # Constante psicrometrica
        gamma = 0.665 * P

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
        
        Inputs:
        - temp_avg: Temperatura promedio en °C
        - radiation: Radiación solar en MJ/m²/day
        - elevation: Elevación en metros
        """
        # Presión atmosférica
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
        
        # Constante psicrométrica
        gamma = 0.665 * P
        
        # Pendiente de la curva de presión de vapor
        delta = 4098 * (0.6108 * math.exp(17.27 * temp_avg / (temp_avg + 237.3))) / ((temp_avg + 237.3) ** 2)
        
        # Fórmula Makkink-Abstew (coeficientes calibrados)
        eto = 0.65 * (delta / (delta + gamma)) * (radiation / 2.45) - 0.05
        
        return round(max(0, eto), 2)
    
    @staticmethod
    def simple_abstew(temp_max: float, temp_min: float, radiation: float) -> float:
        """
        Simple Abstew (1996)
        Método simplificado desarrollado por Abstew
        
        Inputs:
        - temp_max: Temperatura máxima en °C
        - temp_min: Temperatura mínima en °C  
        - radiation: Radiación solar en MJ/m²/day
        """
        # Temperatura promedio
        temp_avg = (temp_max + temp_min) / 2
        
        # Rango de temperatura diario
        temp_range = temp_max - temp_min
        
        # Fórmula Simple Abstew
        # Basada en correlación empírica entre radiación, temperatura y rango térmico
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
        gamma = 0.665 * P

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
        Método empírico basado en temperatura y humedad
        
        Inputs:
        - temp_avg: Temperatura promedio en °C
        - humidity: Humedad relativa en %
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
        Método combinado que considera múltiples factores meteorológicos
        
        Inputs:
        - temp_max, temp_min: Temperaturas en °C
        - humidity: Humedad relativa en %
        - wind_speed: Velocidad del viento en m/s
        - radiation: Radiación solar en MJ/m²/day
        - latitude: Latitud en grados decimales
        - day_of_year: Día del año (1-365)
        - elevation: Elevación en metros
        """
        # Temperatura promedio
        temp_avg = (temp_max + temp_min) / 2
        
        # Presión atmosférica
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
        
        # Constante psicrométrica
        gamma = 0.665 * P
        
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
   