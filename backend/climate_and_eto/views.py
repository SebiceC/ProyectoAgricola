from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from .services.eto_calculator import ETOCalculatorService
from .models import DailyMetereologicalData, MetereologicalSummary, EtoCalculated
from .serializers import DailyMetereologicalDataSerializer, MetereologicalSummarySerializer, EtoCalculatedSerializer
import traceback

# Create your views here.
"""
class DailyMetereologicalDataViewSet(viewsets.ModelViewSet):
    queryset = DailyMetereologicalData.objects.all()
    serializer_class = DailyMetereologicalDataSerializer

class MetereologicalSummaryViewSet(viewsets.ModelViewSet):
    queryset = MetereologicalSummary.objects.all()
    serializer_class = MetereologicalSummarySerializer

class EtoCalculatedViewSet(viewsets.ModelViewSet):
    queryset = EtoCalculated.objects.all()
    serializer_class = EtoCalculatedSerializer
"""

@api_view(['POST'])
def calculate_eto_from_nasa(request):
    """API endpoint para calcular ETO usando datos de NASA"""
    
    # print("endpoint recibido")
    # return Response({"success": True, "message": "Funciona"})
    calculator = ETOCalculatorService()
    
    try:
        # Extraer parámetros
        latitude = float(request.data.get('latitude'))
        longitude = float(request.data.get('longitude'))
        start_date = datetime.strptime(request.data.get('start_date'), '%Y-%m-%d').date()
        end_date = datetime.strptime(request.data.get('end_date'), '%Y-%m-%d').date()
        method = request.data.get('method', 'penman-monteith')
        altitude = float(request.data.get('altitude', 0))

        print("Llamando a NASA API...")
        # Obtener y almacenar datos de NASA
        daily_data = calculator.fetch_and_store_nasa_data(
            #user=request.user, metodo seguro que requiere un usuario autenticado
            user=request.user,
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=end_date,
            altitude=altitude
        )
        print("NASA API respondio")
        
        # Calcular ETO
        eto_result = calculator.calculate_eto_from_daily_data(daily_data, method)
        print("🔎 NASA JSON:", daily_data)
        
        return Response({
            'success': True,
            'eto': eto_result.eto,
            'method': eto_result.get_method_name_display(),
            'period': f"{start_date} to {end_date}",
            'coordinates': f"({latitude}, {longitude})",
            'observations': eto_result.observations
        })
        
    except Exception as e:
        print("Error en calculo de ETO:", str(e))
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def available_methods(request):
    """Lista métodos ETO disponibles"""
    calculator = ETOCalculatorService()
    return Response({
        'methods': calculator.get_available_methods()
    })