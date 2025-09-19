from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from .services.eto_calculator import ETOCalculatorService
import traceback
from drf_spectacular.utils import extend_schema
from .serializers import CalculateETORequestSerializer, CalculateETOResponseSerializer, AvailableMethodsResponseSerializer


@extend_schema(
        request=CalculateETORequestSerializer,
        responses={200: CalculateETOResponseSerializer}
)

@api_view(['POST'])
def calculate_eto_from_nasa(request):
    """API endpoint para calcular ETO usando datos de NASA"""
    
    serializer = CalculateETORequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data


    calculator = ETOCalculatorService()
    
    try:
        
        # Obtener y almacenar datos de NASA
        daily_data = calculator.fetch_and_store_nasa_data(
            user=request.user,
            latitude=data['latitude'],
            longitude=data['longitude'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            altitude=data['altitude']
        )
        print("NASA API respondio")
        
        eto_result = calculator.calculate_eto_from_daily_data(daily_data, data['method'])

        
        return Response({
            'success': True,
            'eto': eto_result.eto,
            'method': eto_result.get_method_name_display(),
            'period': f"{data['start_date']} to {data['end_date']}",
            'coordinates': f"({data['latitude']}, {data['longitude']})",
            'observations': eto_result.observations
        })
        
    except Exception as e:
        print("Error en calculo de ETO:", str(e))
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    responses={200: AvailableMethodsResponseSerializer}        
)

@api_view(['GET'])
def available_methods(request):
    """Lista métodos ETO disponibles"""
    calculator = ETOCalculatorService()
    return Response({
        'methods': calculator.get_available_methods()
    })