from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from datetime import date, timedelta
from django.apps import apps 

# Modelos y Serializers locales
from .models import Crop, CropToPlant, IrrigationExecution
from .serializers import CropSerializer, CropToPlantSerializer, IrrigationExecutionSerializer

# 🟢 IMPORTACIONES NUEVAS (INTEGRACIÓN MODULAR)
# Importamos el servicio de clima inteligente y la configuración del usuario
from climate_and_eto.services import get_hybrid_weather
from climate_and_eto.models import IrrigationSettings

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
    # 🧠 EL MOTOR DE DECISIÓN DE RIEGO (ACTUALIZADO)
    # ---------------------------------------------------------
    @action(detail=True, methods=['get'])
    def calculate_irrigation(self, request, pk=None):
        planting = self.get_object()
        
        # 1. Cargar Configuración del Usuario (O crear default si no existe)
        settings_obj, _ = IrrigationSettings.objects.get_or_create(user=request.user)
        
        # 2. Validar requisitos (Suelo)
        if not planting.soil:
            return Response(
                {"error": "Esta siembra no tiene suelo asignado. Vincule uno primero."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Configurar el "Tanque" del Suelo
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

        # 4. RECONSTRUCCIÓN HISTÓRICA (El "Loop" de Memoria)
        today = date.today()
        start_date = max(planting.fecha_siembra, today - timedelta(days=30))
        
        # Cargar Lluvias
        try:
            RainModel = apps.get_model('precipitaciones', 'PrecipitationRecord')
            rain_queryset = RainModel.objects.filter(
                station__user=request.user, 
                date__range=[start_date, today]
            )
            rains = {r.date: r.effective_precipitation_mm for r in rain_queryset}
        except LookupError:
            rains = {}

        # Cargar Riegos Confirmados
        irrigations = {i.date: i.water_volume_mm for i in planting.irrigations.filter(date__range=[start_date, today])}

        # Simulación Día a Día
        current_water = limit_cc # Asumimos suelo lleno al inicio
        curr = start_date
        
        # Variables para auditoría del último día (Ayer)
        last_eto = 0.0
        last_rain = 0.0
        kc_final = 0.5
        etc_final = 0.0

        while curr < today:
            
            # A. Obtener CLIMA (Híbrido: BD o NASA)
            # Usamos el servicio centralizado que respeta los datos manuales
            weather = get_hybrid_weather(
                user=request.user,
                target_date=curr,
                lat=planting.soil.latitude or 2.92,
                lon=planting.soil.longitude or -75.28
            )
            day_eto = weather.eto_mm

            # B. Obtener LLUVIA EFECTIVA (Según Configuración)
            day_rain_bruta = rains.get(curr, 0.0) or 0.0
            day_rain_eff = 0.0

            if settings_obj.effective_rain_method == 'FIXED':
                day_rain_eff = day_rain_bruta * 0.80 # 80% Fijo
            
            elif settings_obj.effective_rain_method == 'USDA':
                # Fórmula USDA Soil Conservation Service
                if day_rain_bruta < 250:
                    day_rain_eff = day_rain_bruta * (125 - 0.2 * day_rain_bruta) / 125
                else:
                    day_rain_eff = 125 + 0.1 * day_rain_bruta
            
            else: 
                # Fallback / DEPENDABLE
                day_rain_eff = day_rain_bruta * 0.75

            # C. Riegos Aplicados (Afectados por Eficiencia Histórica)
            # Si el usuario regó 10mm pero su eficiencia es 50%, a la planta le llegaron 5mm
            day_irr_bruto = irrigations.get(curr, 0.0) or 0.0
            day_irr_neto = day_irr_bruto * settings_obj.system_efficiency

            # Kc Dinámico
            age_days = (curr - planting.fecha_siembra).days
            kc = 0.5 
            # Lógica Kc simple (Expandir según necesidad)
            if age_days < 20: kc = 0.4
            elif age_days < 50: kc = 0.8
            else: kc = 1.1 

            day_etc = day_eto * kc
            
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

        # 5. DIAGNÓSTICO FINAL (Estado HOY)
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

        # 🟢 CORRECCIÓN CRÍTICA: RIEGO BRUTO
        # Convertimos la necesidad neta a lo que debe bombear el usuario
        efficiency = settings_obj.system_efficiency
        if efficiency <= 0: efficiency = 0.1 # Evitar división por cero
            
        riego_sugerido_bruto = riego_sugerido_neto / efficiency

        response_data = {
            "planting_id": planting.id,
            "fecha_calculo": today,
            "edad_dias": (today - planting.fecha_siembra).days,
            "etapa_fenologica": "Dinámica", 
            "kc_ajustado": round(kc_final, 2),
            "clima": {
                "eto_ayer": round(last_eto, 2),
                "fuente": "NASA POWER / Estación Híbrida"
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
                # Enviamos el BRUTO al frontend
                "riego_sugerido_mm": round(riego_sugerido_bruto, 2),
                "mensaje": mensaje
            }
        }
        
        return Response(response_data)

    @action(detail=True, methods=['get'])
    def water_balance_history(self, request, pk=None):
        planting = self.get_object()
        
        # Cargar configuración para que la gráfica sea consistente con el cálculo
        settings_obj, _ = IrrigationSettings.objects.get_or_create(user=request.user)
        
        soil = planting.soil
        if not soil:
            return Response({"error": "Sin suelo vinculado"}, status=400)

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
        
        try:
            RainModel = apps.get_model('precipitaciones', 'PrecipitationRecord')
            rain_queryset = RainModel.objects.filter(
                station__user=request.user, 
                date__range=[start_date, end_date]
            )
            rains = {r.date: r.effective_precipitation_mm for r in rain_queryset}
        except LookupError:
            rains = {}

        irrigations = {i.date: i.water_volume_mm for i in planting.irrigations.filter(date__range=[start_date, end_date])}

        delta = timedelta(days=1)
        curr = start_date

        while curr <= end_date:
            # a. Obtener Entradas (Rain + Irr)
            rain_bruta = rains.get(curr, 0.0) or 0.0
            
            # Aplicar Fórmula Lluvia (Igual que en calculate_irrigation)
            rain_eff = 0.0
            if settings_obj.effective_rain_method == 'FIXED': rain_eff = rain_bruta * 0.80
            elif settings_obj.effective_rain_method == 'USDA':
                if rain_bruta < 250: rain_eff = rain_bruta * (125 - 0.2 * rain_bruta) / 125
                else: rain_eff = 125 + 0.1 * rain_bruta
            else: rain_eff = rain_bruta * 0.75

            irr_bruto = irrigations.get(curr, 0.0) or 0.0
            # Aplicar Eficiencia Riego
            irr_neto = irr_bruto * settings_obj.system_efficiency
            
            # b. Obtener Salidas (ETo Híbrida)
            # Para la gráfica histórica, también usamos el servicio híbrido
            weather = get_hybrid_weather(
                user=request.user, 
                target_date=curr,
                lat=soil.latitude or 2.92,
                lon=soil.longitude or -75.28
            )
            eto_day = weather.eto_mm
            
            kc = 0.5 # (Aquí también deberías usar la lógica dinámica de Kc)
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
                "irrigation": round(irr_bruto, 2), # Mostramos el bruto en la gráfica (lo que aplicó el usuario)
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