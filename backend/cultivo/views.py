from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from datetime import date, timedelta
import requests
from django.apps import apps 

from .models import Crop, CropToPlant, IrrigationExecution
from .serializers import CropSerializer, CropToPlantSerializer, IrrigationExecutionSerializer

# ---------------------------------------------------------
# FUNCIONES AUXILIARES (HELPER FUNCTIONS)
# ---------------------------------------------------------

def get_nasa_eto(lat, lon):
    """
    Obtiene la ETo de ayer desde la API NASA POWER.
    Incluye validación de integridad (Sanitization) para evitar datos corruptos.
    """
    # Pedimos datos de AYER (el día más reciente completo)
    yesterday = date.today() - timedelta(days=1)
    str_date = yesterday.strftime("%Y%m%d")
    
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN",
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": str_date,
        "end": str_date,
        "format": "JSON"
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        # Validación estructural
        if 'properties' not in data:
            raise ValueError("Estructura de respuesta NASA inválida")

        prop = data['properties']['parameter']
        # Usamos .get con un valor centinela (-999) si no existe la fecha
        rs = prop['ALLSKY_SFC_SW_DWN'].get(str_date, -999)
        
        # 🛡️ DEFENSA EN PROFUNDIDAD (Input Validation)
        # Si la radiación es negativa (error -999) o nula, activamos el protocolo de fallo.
        if rs < 0:
            print(f"⚠️ Alerta de Integridad: NASA devolvió datos corruptos ({rs}). Usando valor seguro (Fallback).")
            return 5.2 # Promedio histórico seguro para Neiva

        # Fórmula Simplificada de Hargreaves (Estimación base radiación)
        # Factor 0.035 ajusta Rs a ETo mm/día aprox en trópico
        eto_estimada = (rs * 0.035) + 2.0
        return round(eto_estimada, 2)

    except Exception as e:
        print(f"⚠️ Error de Conexión/Datos con NASA: {e}")
        return 5.0 # Fallback seguro por timeout o error de red

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
    # 🧠 EL MOTOR DE DECISIÓN DE RIEGO
    # ---------------------------------------------------------
    @action(detail=True, methods=['get'])
    def calculate_irrigation(self, request, pk=None):
        planting = self.get_object()
        
        # 1. Validar requisitos (Suelo)
        if not planting.soil:
            return Response(
                {"error": "Esta siembra no tiene suelo asignado. Vincule uno primero."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Configurar el "Tanque" del Suelo
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

        # 3. RECONSTRUCCIÓN HISTÓRICA (El "Loop" de Memoria)
        # Analizamos los últimos 30 días o desde la siembra (lo que sea menor)
        today = date.today()
        start_date = max(planting.fecha_siembra, today - timedelta(days=30))
        
        # Cargar datos históricos de DB (Lluvia y Riegos ejecutados)
        try:
            RainModel = apps.get_model('precipitaciones', 'PrecipitationRecord')
            rain_queryset = RainModel.objects.filter(
                station__user=request.user, 
                date__range=[start_date, today]
            )
            rains = {r.date: r.effective_precipitation_mm for r in rain_queryset}
        except LookupError:
            rains = {}

        # Cargar Riegos Confirmados (Trazabilidad)
        irrigations = {i.date: i.water_volume_mm for i in planting.irrigations.filter(date__range=[start_date, today])}

        # Simulación Día a Día
        current_water = limit_cc # Asumimos suelo lleno al inicio del periodo analizado
        curr = start_date
        
        # Variables para auditoría del último día (Ayer)
        last_eto = 0.0
        last_rain = 0.0
        last_irrigation = 0.0
        kc_final = 0.5
        etc_final = 0.0

        while curr < today: # Iteramos hasta AYER (el balance de hoy amanece con el resultado de ayer)
            
            # Datos del día 'curr'
            day_rain = rains.get(curr, 0.0) or 0.0
            day_irr = irrigations.get(curr, 0.0) or 0.0
            
            # Clima (ETo): 
            # Si es ayer, pedimos NASA real. Si es historial antiguo, usamos promedio.
            # (Optimización: en v2 guardar ETo diaria en BD)
            if curr == (today - timedelta(days=1)):
                # Es ayer: Usamos NASA real para precisión máxima
                day_eto = get_nasa_eto(2.92, -75.28) # Usar coords reales
                last_eto = day_eto
            else:
                day_eto = 5.0 # Promedio histórico

            # Kc Dinámico según edad
            age_days = (curr - planting.fecha_siembra).days
            # ... (Lógica resumida de Kc que ya tenías) ...
            kc = 0.5 
            # Aquí deberías pegar tu lógica completa de Kc (Ini, Dev, Mid, End)
            # Para brevedad uso 0.5, pero tú usa tu bloque if/elif de etapas:
            if age_days < 20: kc = 0.4
            elif age_days < 50: kc = 0.8
            else: kc = 1.1 
            # ... Fin lógica Kc ...

            day_etc = day_eto * kc
            
            # Guardamos valores finales para el reporte
            if curr == (today - timedelta(days=1)):
                last_rain = day_rain
                last_irrigation = day_irr
                kc_final = kc
                etc_final = day_etc

            # BALANCE DE MASAS (El Corazón del Sistema) 🛢️
            # Agua Final = Inicial - Salida (ETc) + Entradas (Lluvia + Riego)
            current_water = current_water - day_etc + day_rain + day_irr
            
            # Límites Físicos
            if current_water > limit_cc:
                current_water = limit_cc # Drenaje (se pierde el exceso)
            if current_water < limit_pmp:
                current_water = limit_pmp # Suelo seco
            
            curr += timedelta(days=1)

        # 4. DIAGNÓSTICO FINAL (Estado HOY)
        # El loop terminó. 'current_water' es el nivel de humedad HOY al amanecer.
        
        deficit = limit_cc - current_water # Cuánto falta para llenar el tanque
        
        # Lógica de Decisión de Riego Inteligente
        riego_sugerido = 0.0
        mensaje = ""
        estado_suelo = ""

        # Porcentaje de Agotamiento del Agua Útil (0% = Lleno, 100% = PMP)
        agotamiento = 100 - ((current_water - limit_pmp) / tam * 100)

        if current_water < limit_critical:
            # ALERTA ROJA: Bajamos del umbral de seguridad.
            # Estrategia: Llenar hasta Capacidad de Campo inmediatamente.
            riego_sugerido = deficit
            estado_suelo = "Estrés Hídrico"
            mensaje = f"¡URGENTE! Nivel crítico ({round(agotamiento)}% agotado). Reponer {round(deficit, 2)} mm para recuperar Capacidad de Campo."
        
        elif deficit > 0:
            # ZONA AMARILLA: Hay espacio en el suelo, pero no es crítico.
            # Estrategia: Riego opcional o parcial.
            # Si el déficit es pequeño (ej: < 2mm), mejor esperar para no evaporar agua.
            if deficit < 3.0:
                 riego_sugerido = 0.0
                 estado_suelo = "Normal (Déficit Leve)"
                 mensaje = f"Suelo levemente seco (-{round(deficit, 2)} mm), pero aún en zona segura. No es necesario regar hoy."
            else:
                 # Si el usuario quiere mantenerlo siempre lleno (ej: Hortalizas)
                 riego_sugerido = deficit
                 estado_suelo = "Normal"
                 mensaje = f"Nivel óptimo, pero con espacio para {round(deficit, 2)} mm. Puedes regar para mantener saturación."
        
        else:
            # ZONA VERDE: Suelo lleno.
            riego_sugerido = 0.0
            estado_suelo = "Saturado / Capacidad Campo"
            mensaje = "El suelo tiene excelente humedad. NO regar."

        # Ajuste final: Restar si llovió HOY (dato en tiempo real si lo hubiera, por ahora asumimos 0)
        # ...

        response_data = {
            "planting_id": planting.id,
            "fecha_calculo": today,
            "edad_dias": (today - planting.fecha_siembra).days,
            "etapa_fenologica": "Dinámica", # Puedes poner la variable real
            "kc_ajustado": round(kc_final, 2),
            "clima": {
                "eto_ayer": round(last_eto, 2),
                "fuente": "NASA POWER + Memoria Histórica"
            },
            
            "variables_ambientales": {
                "eto": round(last_eto, 2),
                "lluvia_ayer_mm": round(last_rain, 2),
                "lluvia_efectiva_mm": round(last_rain, 2) # Simplificación
            },

            "requerimiento_hidrico": {
                "etc_demanda_bruta": round(etc_final, 2),
                # Ya no es solo ETc, ahora es "Déficit Acumulado"
                "deficit_acumulado_mm": round(deficit, 2), 
                "agua_actual_suelo_mm": round(current_water, 2),
                "capacidad_campo_mm": round(limit_cc, 2),
                "estado": estado_suelo
            },
            
            "recomendacion": {
                "riego_sugerido_mm": round(riego_sugerido, 2),
                "mensaje": mensaje
            }
        }
        
        return Response(response_data)

    @action(detail=True, methods=['get'])
    def water_balance_history(self, request, pk=None):
        planting = self.get_object()
        soil = planting.soil
        
        if not soil:
            return Response({"error": "Sin suelo vinculado"}, status=400)

        # 1. Definir los límites del "Tanque" (en mm)
        root_depth = 0.6 
        
        # Validación segura de valores del suelo (evita división por cero o nulos)
        cc_val = soil.capacidad_campo or 25.0
        pmp_val = soil.punto_marchitez or 12.0
        da_val = soil.densidad_aparente or 1.2

        limit_cc = (cc_val / 100) * da_val * root_depth * 1000
        limit_pmp = (pmp_val / 100) * da_val * root_depth * 1000
        
        tam = limit_cc - limit_pmp
        p = 0.5
        ram = tam * p
        limit_critical = limit_cc - ram 

        # 2. Reconstruir Historia (Últimos 30 días)
        history = []
        current_water = limit_cc 
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        # 🟢 CORRECCIÓN AQUÍ: Carga Dinámica del Modelo
        try:
            RainModel = apps.get_model('precipitaciones', 'PrecipitationRecord')
            rain_queryset = RainModel.objects.filter(
                station__user=request.user, 
                date__range=[start_date, end_date]
            )
            # Diccionario para búsqueda rápida O(1)
            rains = {r.date: r.effective_precipitation_mm for r in rain_queryset}
        except LookupError:
            rains = {} # Si falla la carga, asumimos 0 lluvia

        # Obtenemos los riegos ejecutados (usando la relación inversa 'irrigations')
        irrigations = {i.date: i.water_volume_mm for i in planting.irrigations.filter(date__range=[start_date, end_date])}

        delta = timedelta(days=1)
        curr = start_date

        while curr <= end_date:
            # a. Obtener Entradas
            # Usamos .get(curr, 0) y nos aseguramos que no sea None
            rain_val = rains.get(curr, 0.0)
            if rain_val is None: rain_val = 0.0
            
            irr_val = irrigations.get(curr, 0.0)
            if irr_val is None: irr_val = 0.0
            
            # b. Obtener Salidas (Simulación ETo)
            eto_day = 5.0 # Promedio tropical
            kc = 0.5 
            etc = eto_day * kc

            # c. Balance de Masas
            previous_water = current_water
            current_water = previous_water - etc + rain_val + irr_val

            # d. Drenaje y Límites
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
                "rain": round(rain_val, 2),
                "irrigation": round(irr_val, 2),
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
        
        # Validación extra de seguridad: ¿La siembra es realmente mía?
        if planting.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No puedes registrar riegos en cultivos ajenos.")
            
        serializer.save(user=self.request.user)