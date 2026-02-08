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
from climate_and_eto.models import IrrigationSettings
from precipitaciones.services import get_precipitation_strictly_local
# Usamos apps.get_model para evitar importaciones circulares si las hubiera, 
# o importamos directo si la estructura lo permite.
from precipitaciones.models import Station 

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

        # 4. Configurar el "Tanque" del Suelo
        s = planting.soil
        root_depth = 0.6 # Profundidad efectiva (m)
        
        # Valores seguros (Fallback)
        cc_val = s.capacidad_campo or 25.0
        pmp_val = s.punto_marchitez or 12.0
        da_val = s.densidad_aparente or 1.2
        
        # Límites en milímetros (Volumen de agua)
        limit_cc = (cc_val / 100) * da_val * root_depth * 1000  # Tanque Lleno
        limit_pmp = (pmp_val / 100) * da_val * root_depth * 1000 # Tanque Vacío
        
        tam = limit_cc - limit_pmp # Agua Útil Total
        ram = tam * 0.5            # Agua Fácilmente Disponible (50% del útil)
        limit_critical = limit_cc - ram # Umbral de Riego (Línea Naranja)

        # 5. RECONSTRUCCIÓN HISTÓRICA (Loop de Memoria Estricto)
        today = date.today()
        start_date = max(planting.fecha_siembra, today - timedelta(days=30))
        
        # Precarga de Riegos (Para evitar N+1 queries en riegos)
        irrigations = {i.date: i.water_volume_mm for i in planting.irrigations.filter(date__range=[start_date, today])}

        # Simulación Día a Día
        current_water = limit_cc # Asumimos suelo lleno al inicio del periodo de simulación
        curr = start_date
        
        # Variables para auditoría del último día (Ayer)
        last_eto = 0.0
        last_rain = 0.0
        kc_final = 0.5
        etc_final = 0.0

        try:
            while curr < today:
                
                # A. OBTENER CLIMA (ESTRICTO LOCAL)
                # Si falta el dato, 'get_weather_strictly_local' lanzará ObjectDoesNotExist
                weather_record = get_weather_strictly_local(user, curr)
                day_eto = weather_record.eto_mm

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
                "fuente": "Base de Datos Local (Validada)"
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

        # 1. Definir los límites
        root_depth = 0.6 
        cc_val = soil.capacidad_campo or 25.0
        pmp_val = soil.punto_marchitez or 12.0
        da_val = soil.densidad_aparente or 1.2

        limit_cc = (cc_val / 100) * da_val * root_depth * 1000
        limit_pmp = (pmp_val / 100) * da_val * root_depth * 1000
        
        tam = limit_cc - limit_pmp
        limit_critical = limit_cc - (tam * 0.5)

        # 2. Reconstruir Historia
        history = []
        current_water = limit_cc 
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        irrigations = {i.date: i.water_volume_mm for i in planting.irrigations.filter(date__range=[start_date, end_date])}

        delta = timedelta(days=1)
        curr = start_date

        while curr <= end_date:
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
            
            # b. ETo
            eto_day = 0.0
            try:
                weather_rec = get_weather_strictly_local(request.user, curr)
                eto_day = weather_rec.eto_mm
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