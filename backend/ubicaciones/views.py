from django.shortcuts import render
from .serializers import UbicacionSerializer, SueloSerializer, PrecipitacionSerializer, EtoSerializer
from .models import Ubicacion, Suelo, Precipitacion, Eto
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics


class UbicacionAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo ubicacions.
    """
    def get(self, request):
        ubicaciones = Ubicacion.objects.all()
        serializer = UbicacionSerializer(ubicaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UbicacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class UbicacionDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo ubicacions.
    """
    def get(self, request, pk):
        try:
            ubicacion = Ubicacion.objects.get(pk=pk)
        except Ubicacion.DoesNotExist:
            return Response({"error": "Ubication not found"}, status=404)

        serializer = UbicacionSerializer(ubicacion)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            ubicacion = Ubicacion.objects.get(pk=pk)
        except Ubicacion.DoesNotExist:
            return Response({"error": "Ubication not found"}, status=404)

        serializer = UbicacionSerializer(ubicacion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            ubicacion = Ubicacion.objects.get(pk=pk)
        except Ubicacion.DoesNotExist:
            return Response({"error": "ubication not found"}, status=404)

        ubicacion.delete()
        return Response(status=204)

class SueloAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo Suelo.
    """
    def get(self, request):
        soil = Suelo.objects.all()
        serializer = SueloSerializer(soil, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SueloSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class SueloDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo Suelo.
    """
    def get(self, request, pk):
        try:
            soil = Suelo.objects.get(pk=pk)
        except Suelo.DoesNotExist:
            return Response({"error": "Soil not found"}, status=404)

        serializer = SueloSerializer(soil)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            soil = Suelo.objects.get(pk=pk)
        except Suelo.DoesNotExist:
            return Response({"error": "Soil not found"}, status=404)

        serializer = SueloSerializer(soil, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            soil = Suelo.objects.get(pk=pk)
        except Suelo.DoesNotExist:
            return Response({"error": "Soil not found"}, status=404)

        soil.delete()
        return Response(status=204)

class PrecipitacionAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo Precipitacion.
    """
    def get(self, request):
        precipitaciones = Precipitacion.objects.all()
        serializer = PrecipitacionSerializer(precipitaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PrecipitacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class PrecipitacionDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo Precipitacion.
    """
    def get(self, request, pk):
        try:
            precipitacion = Precipitacion.objects.get(pk=pk)
        except Precipitacion.DoesNotExist:
            return Response({"error": "Precipitation not found"}, status=404)

        serializer = PrecipitacionSerializer(precipitacion)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            precipitacion = Precipitacion.objects.get(pk=pk)
        except Precipitacion.DoesNotExist:
            return Response({"error": "Precipitation not found"}, status=404)

        serializer = PrecipitacionSerializer(precipitacion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            precipitacion = Precipitacion.objects.get(pk=pk)
        except Precipitacion.DoesNotExist:
            return Response({"error": "Precipitation not found"}, status=404)

        precipitacion.delete()
        return Response(status=204)

class EtoAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo Eto.
    """
    def get(self, request):
        eto = Eto.objects.all()
        serializer = EtoSerializer(eto, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EtoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class EtoDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo Eto.
    """
    def get(self, request, pk):
        try:
            eto = Eto.objects.get(pk=pk)
        except Eto.DoesNotExist:
            return Response({"error": "Eto not found"}, status=404)

        serializer = EtoSerializer(eto)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            eto = Eto.objects.get(pk=pk)
        except Eto.DoesNotExist:
            return Response({"error": "Eto not found"}, status=404)

        serializer = EtoSerializer(eto, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            eto = Eto.objects.get(pk=pk)
        except Eto.DoesNotExist:
            return Response({"error": "Eto not found"}, status=404)

        eto.delete()
        return Response(status=204)