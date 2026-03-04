from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from datetime import date, timedelta
from django.apps import apps 
from django.core.exceptions import ObjectDoesNotExist

# Modelos y Serializers locales
from .models import Crop, CropToPlant, IrrigationExecution
from .serializers import CropSerializer, CropToPlantSerializer, IrrigationExecutionSerializer

# 🟢 SERVICIOS ESTRICTOS (Solo Base de Datos Local)
from climate_and_eto.services import get_weather_strictly_local
from climate_and_eto.models import IrrigationSettings, ClimateStudy
from precipitaciones.services import get_precipitation_strictly_local
# Usamos apps.get_model para evitar importaciones circulares si las hubiera, 
# o importamos directo si la estructura lo permite.
from precipitaciones.models import Station 


def _get_eto_for_planting(planting, user, eval_date):
    """
    Función centralizada para obtener la ETo de un día dado.
    Si la siembra usa fuente DAILY → consulta DailyWeather (NASA/Sensores).
    Si la siembra usa fuente HISTORICAL → extrae del JSON del ClimateStudy.
    
    Estructura del JSON de ClimateStudy.result_data:
    [
        {"month": 1, "month_name": "January", "eto_results": {"PENMAN": 5.2, "HARGREAVES": 4.8}},
        {"month": 2, ...},
        ...
    ]
    
    Retorna float (mm/día). Lanza ObjectDoesNotExist si no hay datos.
    """
    if planting.eto_source == 'HISTORICAL' and planting.historical_study_id:
        study = planting.historical_study
        if not study or not study.result_data:
            raise ObjectDoesNotExist(
                f"El estudio histórico vinculado (ID={planting.historical_study_id}) no contiene datos."
            )
        
        month_num = eval_date.month
        formula_key = planting.historical_formula_choice
        
        # Buscar la fila del mes correspondiente en el JSON
        month_row = None
        for row in study.result_data:
            row_month = row.get('month') or row.get('mes')
            if row_month and int(row_month) == month_num:
                month_row = row
                break
        
        if not month_row:
            raise ObjectDoesNotExist(
                f"No se encontraron datos para el mes {month_num} en el estudio '{study.name}'."
            )
        
        # Las fórmulas están dentro de "eto_results" (sub-diccionario)
        eto_results = month_row.get('eto_results', {})
        # Fallback: si no hay "eto_results", buscar fórmulas en la raíz (compatibilidad)
        if not eto_results:
            excluded_keys = {'mes', 'month', 'month_name', 'name'}
            eto_results = {k: v for k, v in month_row.items() if k not in excluded_keys and isinstance(v, (int, float))}
        
        if formula_key == 'AVERAGE_ALL':
            values = [v for v in eto_results.values() if isinstance(v, (int, float))]
            if not values:
                raise ObjectDoesNotExist(
                    f"No hay valores numéricos de ETo en el mes {month_num} del estudio '{study.name}'."
                )
            return sum(values) / len(values)
        else:
            eto_val = eto_results.get(formula_key)
            if eto_val is None:
                raise ObjectDoesNotExist(
                    f"La fórmula '{formula_key}' no existe en el mes {month_num} del estudio '{study.name}'."
                )
            return float(eto_val)
    else:
        # Modo DAILY: lectura estricta de la base de datos local
        weather_record = get_weather_strictly_local(user, eval_date)
        return weather_record.eto_mm


# ---------------------------------------------------------
# VISTAS (VIEWSETS)
# ---------------------------------------------------------

class CropViewSet(viewsets.ModelViewSet):
    """
    Gestión de Cultivos Base (Catálogo).
    El usuario ve los públicos (user=Null) y los propios.
    """
    serializer_class = CropSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Crop.objects.filter(Q(user__isnull=True) | Q(user=self.request.user))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CropToPlantViewSet(viewsets.ModelViewSet):
    """
    Gestión de Siembras (Lotes Activos).
    Incluye el cerebro de cálculo de riego.
    """
    serializer_class = CropToPlantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CropToPlant.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # ---------------------------------------------------------
    # 🧠 EL MOTOR DE DECISIÓN DE RIEGO (MODO ESTRICTO)
    # ---------------------------------------------------------
    @action(detail=True, methods=['get'])
    def calculate_irrigation(self, request, pk=None):
        planting = self.get_object()
        user = request.user
        
        # 1. Cargar Configuración del Usuario (O crear default si no existe)
        settings_obj, _ = IrrigationSettings.objects.get_or_create(user=user)
        
        # 2. VALIDACIÓN A: SUELO
        if not planting.soil:
            return Response(
                {"error": "Falta Suelo", "message": "Esta siembra no tiene suelo asignado. Vincule uno primero."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 3. VALIDACIÓN B: ESTACIÓN METEOROLÓGICA (Para Lluvias)
        # Asumimos que el usuario debe tener una estación propia o asignada
        station = Station.objects.filter(user=user).first()
        if not station:
             return Response(
                {
                    "error": "Falta Estación", 
                    "message": "No tiene una estación meteorológica configurada. Vaya al módulo 'Precipitaciones' y cree una estación para registrar las lluvias."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        s = planting.soil
        # Valores seguros (Fallback)
        cc_val = s.capacidad_campo or 25.0
        pmp_val = s.punto_marchitez or 12.0
        da_val = s.densidad_aparente or 1.2
        p_val = planting.crop.agotam_critico or 0.5
        
        # Función auxiliar para calcular límites diarios basados en la profundidad radicular
        def get_day_limits(date_eval):
            crop = planting.crop
            age_d = (date_eval - planting.fecha_siembra).days
            if age_d < 0: age_d = 0
            
            d_ini = crop.etapa_inicial or 20
            d_dev = crop.etapa_desarrollo or 30
            
            # Profundidades seguras (fallback si están en 0 o Null)
            pr_ini = crop.prof_radicular_ini if crop.prof_radicular_ini else 0.3
            pr_max = crop.prof_radicular_max if crop.prof_radicular_max else 1.0
            
            if age_d < d_ini:
                rd = pr_ini
            elif age_d < (d_ini + d_dev):
                progress = (age_d - d_ini) / d_dev
                rd = pr_ini + progress * (pr_max - pr_ini)
            else:
                rd = pr_max
                
            l_cc = (cc_val / 100) * da_val * rd * 1000  # Tanque Lleno
            l_pmp = (pmp_val / 100) * da_val * rd * 1000 # Tanque Vacío
            t_am = l_cc - l_pmp                            # Agua Útil
            l_crit = l_cc - (t_am * p_val)                 # Umbral Crítico (p)
            
            return rd, l_cc, l_pmp, t_am, l_crit

        # 5. RECONSTRUCCIÓN HISTÓRICA (Loop de Memoria Estricto)
        today = date.today()
        start_date = max(planting.fecha_siembra, today - timedelta(days=30))
        
        # Precarga de Riegos (Para evitar N+1 queries en riegos)
        irrigations = {i.date: i.water_volume_mm for i in planting.irrigations.filter(date__range=[start_date, today])}

        # Simulación Día a Día
        rd, limit_cc, limit_pmp, tam, limit_critical = get_day_limits(start_date)
        current_water = limit_cc # Asumimos suelo lleno al inicio del periodo de simulación
        curr = start_date
        
        # Variables para auditoría del último día (Ayer)
        last_eto = 0.0
        last_rain = 0.0
        kc_final = 0.5
        etc_final = 0.0

        try:
            while curr < today:
                
                # A.0. Actualizar Límites Diarios (Crecimiento de Raíz)
                new_rd, new_limit_cc, limit_pmp, tam, limit_critical = get_day_limits(curr)
                # Si la raíz crece, asumimos que explora suelo a Capacidad de Campo
                delta_cc = new_limit_cc - limit_cc
                if delta_cc > 0:
                    current_water += delta_cc
                limit_cc = new_limit_cc

                # A. OBTENER ETo (DAILY o HISTORICAL según configuración de siembra)
                day_eto = _get_eto_for_planting(planting, user, curr)

                # B. OBTENER LLUVIA (ESTRICTO LOCAL)
                # Si falta el dato, 'get_precipitation_strictly_local' lanzará ObjectDoesNotExist
                precip_record = get_precipitation_strictly_local(station, curr)
                day_rain_bruta = precip_record.effective_precipitation_mm # Usamos el valor guardado
                
                # Cálculo de Lluvia Efectiva (Según Configuración)
                day_rain_eff = 0.0
                if settings_obj.effective_rain_method == 'FIXED':
                    day_rain_eff = day_rain_bruta * 0.80 
                elif settings_obj.effective_rain_method == 'USDA':
                    if day_rain_bruta < 250:
                        day_rain_eff = day_rain_bruta * (125 - 0.2 * day_rain_bruta) / 125
                    else:
                        day_rain_eff = 125 + 0.1 * day_rain_bruta
                else: 
                    day_rain_eff = day_rain_bruta * 0.75

                # C. Riegos Aplicados
                day_irr_bruto = irrigations.get(curr, 0.0) or 0.0
                day_irr_neto = day_irr_bruto * settings_obj.system_efficiency

                # D. Kc Dinámico
                age_days = (curr - planting.fecha_siembra).days
                kc = 0.5 
                # Lógica Kc simple (Expandir según necesidad)
                if age_days < 20: kc = 0.4
                elif age_days < 50: kc = 0.8
                else: kc = 1.1 

                day_etc = day_eto * kc
                
                # Guardar estado del último día simulado (Ayer)
                if curr == (today - timedelta(days=1)):
                    last_eto = day_eto
                    last_rain = day_rain_bruta
                    kc_final = kc
                    etc_final = day_etc

                # BALANCE DE MASAS
                current_water = current_water - day_etc + day_rain_eff + day_irr_neto
                
                # Límites Físicos
                if current_water > limit_cc: current_water = limit_cc 
                if current_water < limit_pmp: current_water = limit_pmp 
                
                curr += timedelta(days=1)

        except ObjectDoesNotExist as e:
            # CAPTURA DE ERROR DE DATOS FALTANTES
            return Response(
                {
                    "error": "Datos Faltantes ", 
                    "message": str(e),
                    "date": curr.strftime("%Y-%m-%d"),
                    "solution": f"Debe registrar los datos climáticos/pluviométricos del día {curr.strftime('%Y-%m-%d')} antes de continuar."
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        except Exception as e:
            return Response(
                {"error": "Error Interno de Cálculo", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 6. DIAGNÓSTICO FINAL (Estado HOY)
        deficit_neto = limit_cc - current_water 
        
        riego_sugerido_neto = 0.0
        mensaje = ""
        estado_suelo = ""

        # Porcentaje de Agotamiento
        agotamiento = 100 - ((current_water - limit_pmp) / tam * 100)

        if current_water < limit_critical:
            riego_sugerido_neto = deficit_neto
            estado_suelo = "Estrés Hídrico"
            mensaje = f"¡URGENTE! Nivel crítico ({round(agotamiento)}% agotado). Reponer lámina para recuperar CC."
        
        elif deficit_neto > 0:
            if deficit_neto < 3.0:
                 riego_sugerido_neto = 0.0
                 estado_suelo = "Normal (Déficit Leve)"
                 mensaje = f"Suelo levemente seco (-{round(deficit_neto, 2)} mm), no es necesario regar hoy."
            else:
                 riego_sugerido_neto = deficit_neto
                 estado_suelo = "Normal"
                 mensaje = f"Nivel óptimo, pero cabe agua. Puedes regar para saturar."
        else:
            riego_sugerido_neto = 0.0
            estado_suelo = "Saturado"
            mensaje = "Suelo lleno. NO regar."

        # Riego Bruto (Considerando Eficiencia)
        efficiency = settings_obj.system_efficiency
        if efficiency <= 0: efficiency = 0.1
        riego_sugerido_bruto = riego_sugerido_neto / efficiency

        # --- 🟢 NUEVO: CÁLCULO DE VOLUMEN TOTAL ---
        # Fórmula: 1 mm = 10 m³/ha
        # Volumen (m³) = Lámina (mm) * Área (ha) * 10
        volumen_m3 = riego_sugerido_bruto * planting.area * 10
        volumen_litros = volumen_m3 * 1000

        response_data = {
            "planting_id": planting.id,
            "fecha_calculo": today,
            "edad_dias": (today - planting.fecha_siembra).days,

            # Datos Geométricos
            "area_finca_ha": planting.area,
            "densidad_plantas": planting.densidad_calculada,

            "etapa_fenologica": "Dinámica", 
            "kc_ajustado": round(kc_final, 2),
            "clima": {
                "eto_ayer": round(last_eto, 2),
                "fuente": (
                    f"Estudio Histórico: {planting.historical_study.name} ({planting.historical_formula_choice})"
                    if planting.eto_source == 'HISTORICAL' and planting.historical_study
                    else "Base de Datos Local (Validada)"
                )
            },
            "variables_ambientales": {
                "eto": round(last_eto, 2),
                "lluvia_ayer_mm": round(last_rain, 2),
            },
            "requerimiento_hidrico": {
                "etc_demanda_bruta": round(etc_final, 2),
                "deficit_acumulado_mm": round(deficit_neto, 2), 
                "agua_actual_suelo_mm": round(current_water, 2),
                "capacidad_campo_mm": round(limit_cc, 2),
                "estado": estado_suelo,
                "eficiencia_sistema": f"{int(efficiency*100)}%"
            },
            "recomendacion": {
                "riego_sugerido_mm": round(riego_sugerido_bruto, 2),
                "volumen_total_m3": round(volumen_m3, 2),            # Volumen m3
                "volumen_total_litros": round(volumen_litros),       # Volumen Litros
                "mensaje": mensaje
            }
        }
        
        return Response(response_data)

    @action(detail=True, methods=['get'])
    def water_balance_history(self, request, pk=None):
        planting = self.get_object()
        
        # Cargar configuración
        settings_obj, _ = IrrigationSettings.objects.get_or_create(user=request.user)
        
        soil = planting.soil
        if not soil:
            return Response({"error": "Sin suelo vinculado"}, status=400)
        
        # Intentamos obtener la estación para graficar lluvias
        station = Station.objects.filter(user=request.user).first()

        # 1. Definir los límites base
        cc_val = soil.capacidad_campo or 25.0
        pmp_val = soil.punto_marchitez or 12.0
        da_val = soil.densidad_aparente or 1.2
        p_val = planting.crop.agotam_critico or 0.5

        def get_day_limits(date_eval):
            crop = planting.crop
            age_d = (date_eval - planting.fecha_siembra).days
            if age_d < 0: age_d = 0
            
            d_ini = crop.etapa_inicial or 20
            d_dev = crop.etapa_desarrollo or 30
            
            pr_ini = crop.prof_radicular_ini if crop.prof_radicular_ini else 0.3
            pr_max = crop.prof_radicular_max if crop.prof_radicular_max else 1.0
            
            if age_d < d_ini:
                rd = pr_ini
            elif age_d < (d_ini + d_dev):
                progress = (age_d - d_ini) / d_dev
                rd = pr_ini + progress * (pr_max - pr_ini)
            else:
                rd = pr_max
                
            l_cc = (cc_val / 100) * da_val * rd * 1000
            l_pmp = (pmp_val / 100) * da_val * rd * 1000
            t_am = l_cc - l_pmp
            l_crit = l_cc - (t_am * p_val)
            
            return rd, l_cc, l_pmp, t_am, l_crit

        # 2. Reconstruir Historia
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        rd, limit_cc, limit_pmp, tam, limit_critical = get_day_limits(start_date)
        current_water = limit_cc
        history = []
        
        irrigations = {i.date: i.water_volume_mm for i in planting.irrigations.filter(date__range=[start_date, end_date])}

        curr = start_date
        delta = timedelta(days=1)

        while curr <= end_date:
            # 2.0 Crecimiento Radicular del día
            new_rd, new_limit_cc, limit_pmp, tam, limit_critical = get_day_limits(curr)
            delta_cc = new_limit_cc - limit_cc
            if delta_cc > 0:
                current_water += delta_cc
            limit_cc = new_limit_cc
            
            # NOTA: Para la gráfica histórica permitimos huecos (try/except silencioso)
            # para no romper toda la gráfica por un día faltante.
            
            # a. Lluvia
            rain_bruta = 0.0
            if station:
                try:
                    # Usamos el servicio estricto pero atrapamos el error si falta data histórica antigua
                    precip_rec = get_precipitation_strictly_local(station, curr)
                    rain_bruta = precip_rec.effective_precipitation_mm
                except ObjectDoesNotExist:
                    rain_bruta = 0.0 
            
            # Fórmula Lluvia
            rain_eff = 0.0
            if settings_obj.effective_rain_method == 'FIXED': rain_eff = rain_bruta * 0.80
            elif settings_obj.effective_rain_method == 'USDA':
                if rain_bruta < 250: rain_eff = rain_bruta * (125 - 0.2 * rain_bruta) / 125
                else: rain_eff = 125 + 0.1 * rain_bruta
            else: rain_eff = rain_bruta * 0.75

            irr_bruto = irrigations.get(curr, 0.0) or 0.0
            irr_neto = irr_bruto * settings_obj.system_efficiency
            
            # b. ETo (DAILY o HISTORICAL según configuración de siembra)
            eto_day = 0.0
            try:
                eto_day = _get_eto_for_planting(planting, request.user, curr)
            except ObjectDoesNotExist:
                # Si falta ETo en histórico, asumimos promedio o 0 para no romper la UI, 
                # pero idealmente el usuario ya debió corregirlo en el cálculo principal.
                eto_day = 4.0 
            
            kc = 0.5 
            etc = eto_day * kc

            # c. Balance
            current_water = current_water - etc + rain_eff + irr_neto

            drainage = 0.0
            if current_water > limit_cc:
                drainage = current_water - limit_cc
                current_water = limit_cc 
            if current_water < limit_pmp:
                current_water = limit_pmp

            history.append({
                "date": curr.strftime("%Y-%m-%d"),
                "water_level": round(current_water, 2),
                "field_capacity": round(limit_cc, 2),
                "critical_point": round(limit_critical, 2),
                "wilting_point": round(limit_pmp, 2),
                "rain": round(rain_bruta, 2),
                "irrigation": round(irr_bruto, 2),
                "drainage": round(drainage, 2)
            })
            
            curr += delta

        return Response(history)


class IrrigationExecutionViewSet(viewsets.ModelViewSet):
    """
    Endpoint de Auditoría. Permite registrar y consultar el historial de riegos.
    """
    serializer_class = IrrigationExecutionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Principio de Aislamiento: Solo ver riegos de MIS siembras
        return IrrigationExecution.objects.filter(planting__user=self.request.user)

    def perform_create(self, serializer):
        # Inyección automática del responsable (Non-Repudiation)
        planting = serializer.validated_data['planting']
        
        if planting.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No puedes registrar riegos en cultivos ajenos.")
            
        serializer.save(user=self.request.user)