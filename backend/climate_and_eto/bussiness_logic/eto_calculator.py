from datetime import date
from typing import Dict, List, Optional
from django.contrib.auth.models import User
from ..models import DailyMetereologicalData, MetereologicalSummary, EtoCalculated
from .nasa_power_api import NASAPowerAPI
from ..eto_formules import ETOFormulas

class ETOCalculatorService:

    def __init__(self):
        self.nasa_api = NASAPowerAPI()
        self.formulas = ETOFormulas()

    def fetch_and_store_nasa_data(self, user: User, latitude: float, longitude: float, start_date: date, end_date: date, altitude: float = 0) -> DailyMetereologicalData:

        """
        Obtiene datos de NASA POWER y los almacena en la BD
        """

        if user is None:
            pass
        
        existing_data = DailyMetereologicalData.objects.filter(
            user=user,
            start_date=start_date,
            end_date=end_date,
            latitude=latitude,
            longitude=longitude
        ).first()

        if existing_data:
            return existing_data

        #Obtener datos de NASA POWER
        daily_data = self.nasa_api.get_daily_data(latitude, longitude, start_date, end_date)

        #Crear registro en BD
        metereological_data = DailyMetereologicalData.objects.create(
            user=user,
            start_date=start_date,
            end_date=end_date,
            latitude=latitude,
            longitude=longitude,
            altitude=altitude,
            daily_data=daily_data
        )

        return metereological_data
    
    def calculate_eto_from_daily_data(self, daily_data: DailyMetereologicalData, method: str) -> EtoCalculated:
        """
        Calcula ETO usando datos diarios almacenados
        """

        method_mapping = {
            "penman-monteith": self._calculate_penman_monteith,
            "hargreaves": self._calculate_hargreaves,
            "turc": self._calculate_turc,
            "makkink": self._calculate_makkink,
            "makkink-abstew": self._calculate_makkink_abstew,
            "simple-abstew": self._calculate_simple_abstew,
            "priestley-taylor": self._calculate_priestley_taylor,
            "ivanov": self._calculate_ivanov,
            "christiansen": self._calculate_christiansen,
        }

        if method not in method_mapping:
            raise ValueError(f"Metodo {method} no soportado")
        
        # Calcular ETO promedio para el periodo
        eto_values = []
        observations = []

        for date_str, day_data in daily_data.daily_data.items():
            try:
                print(f"\n Calculando {method} para {date_str}")
                print(f" Datos usados: {day_data}")

                day_eto = method_mapping[method](day_data,daily_data, date_str)

                if day_eto is not None:
                    eto_values.append(day_eto)
                    print(f"Dia {date_str}: ETO = {day_eto}")
                else:
                    msg = f" dia {date_str}: calculo devolvió None"
                    observations.append(msg)
                    print(msg)
            except Exception as e:
                msg = f"Error en {date_str}: {str(e)}"
                observations.append(msg)
                print(msg)


        if not eto_values:
            raise ValueError("No se pudo calcular ETO para ningun dia")
        
        avg_eto = sum(eto_values) / len(eto_values)

        # Crear registro de ETO calculado
        eto_calculated = EtoCalculated.objects.create(
            method_name=method,
            data_source='API',
            calculation_date=date.today(),
            eto=avg_eto,
            observations="\n".join(observations) if observations else None
        )

        eto_calculated.daily_data.add(daily_data)

        return eto_calculated
    
    def _calculate_penman_monteith(
            self, 
            day_data: Dict, 
            daily_data: DailyMetereologicalData, date_str: str
        ) -> float:
        """Wrapper para Penman-Monteith"""
        date_obj = date.fromisoformat(date_str)
        day_of_year = date_obj.timetuple().tm_yday
        
        return ETOFormulas.penman_monteith(
            temp_max=day_data['temp_max'],
            temp_min=day_data['temp_min'],
            humidity=day_data['humidity'],
            wind_speed=day_data['wind_speed'],
            radiation=day_data['radiation'],
            latitude=daily_data.latitude,
            day_of_year=day_of_year,
            elevation=daily_data.altitude
        )
    
    def _calculate_hargreaves(self, day_data: Dict, daily_data: DailyMetereologicalData, date_str: str) -> float:
        """Wrapper para Hargreaves-Samani"""
        date_obj = date.fromisoformat(date_str)
        day_of_year = date_obj.timetuple().tm_yday
        
        return ETOFormulas.hargreaves(
            temp_max=day_data['temp_max'],
            temp_min=day_data['temp_min'],
            temp_avg=day_data['temp_avg'],
            latitude=daily_data.latitude,
            day_of_year=day_of_year
        )
    
    
    def _calculate_turc(self, day_data: Dict, daily_data: DailyMetereologicalData, date_str: str) -> float:
        """Wrapper para Turc"""
        
        return ETOFormulas.turc(
            temp_avg=day_data['temp_avg'],
            humidity=day_data['humidity'],
            radiation=day_data['radiation']
        )
    
    def _calculate_makkink(self, day_data: Dict, daily_data: DailyMetereologicalData, date_str: str) -> float:
        """Wrapper debug para Makkink — imprime inputs y resultado crudo"""
        try:
            temp_avg = day_data.get('temp_avg')
            rad = day_data.get('radiation')
            elev = daily_data.altitude

            print("Makkink inputs -> temp_avg:", temp_avg, "radiation:", rad, "elevation:", elev)

            # Prueba sin conversión
            raw = self.formulas.makkink(temp_avg=temp_avg, radiation=rad, elevation=elev)
            print("Makkink raw result:", raw)

            # Si sospechas unidad: prueba conversión MJ/m2/day -> W/m2 (o al revés)
            rad_wm2 = rad * 11.574 if rad is not None else None
            print("Makkink radiación convertida (MJ->W/m2):", rad_wm2)
            try:
                raw_conv = self.formulas.makkink(temp_avg=temp_avg, radiation=rad_wm2, elevation=elev)
                print("Makkink result (radiation en W/m2):", raw_conv)
            except Exception as e:
                print("Falló llamada con radiación convertida:", e)

            return round(max(0, raw), 2) if raw is not None else None

        except Exception as e:
            print("Error interno Makkink:", e)
            raise

    # def _calculate_makkink(self, day_data: Dict, daily_data: DailyMetereologicalData, date_str: str) -> float:
    #     """Wrapper para Makkink"""
        
    #     return ETOFormulas.makkink(
    #         temp_avg=day_data['temp_avg'],
    #         radiation=day_data['radiation'],
    #         elevation=daily_data.altitude
    #     )
    
    def _calculate_makkink_abstew(self, day_data: Dict, daily_data: DailyMetereologicalData, date_str: str) -> float:
        """Wrapper para Makkink-Abstew"""
        return ETOFormulas.makkink_abstew(
            temp_avg=day_data['temp_avg'],
            radiation=day_data['radiation'],
            elevation=daily_data.altitude
        )
    
    def _calculate_simple_abstew(self, day_data: Dict, daily_data: DailyMetereologicalData, date_str: str) -> float:
        """Wrapper para Simple Abstew (1996)"""
        return ETOFormulas.simple_abstew(
            temp_max=day_data['temp_max'],
            temp_min=day_data['temp_min'],
            radiation=day_data['radiation']
        )
    
    def _calculate_priestley_taylor(self, day_data: Dict, daily_data: DailyMetereologicalData, date_str: str) -> float:
        """Wrapper para Priestley-Taylor"""        
        return ETOFormulas.priestley_taylor(
            temp_avg=day_data['temp_avg'],
            radiation=day_data['radiation'],
            elevation=daily_data.altitude
        )
    
    def _calculate_ivanov(self, day_data: Dict, daily_data: DailyMetereologicalData, date_str: str) -> float:
        """Wrapper para Ivanov (1954)"""        
        return ETOFormulas.ivanov(
            temp_avg=day_data['temp_avg'],
            humidity=day_data['humidity']
        )
    
    def _calculate_christiansen(self, day_data: Dict, daily_data: DailyMetereologicalData, date_str: str) -> float:
        """Wrapper para Christiansen"""
        date_obj = date.fromisoformat(date_str)
        day_of_year = date_obj.timetuple().tm_yday
        
        return ETOFormulas.christiansen(
            temp_max=day_data['temp_max'],
            temp_min=day_data['temp_min'],
            humidity=day_data['humidity'],
            wind_speed=day_data['wind_speed'],
            radiation=day_data['radiation'],
            latitude=daily_data.latitude,
            day_of_year=day_of_year,
            elevation=daily_data.altitude
        )
    
    def get_available_methods(self) -> List[Dict]:
        """Retorna los métodos disponibles"""
        return [
            {'key': method[0], 'name': method[1]} 
            for method in EtoCalculated.ETO_METHODS
        ]