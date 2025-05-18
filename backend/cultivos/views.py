from django.shortcuts import render
from .serializers import CultivosSerializer, EtapaSerializer, CultivoSueloSerializer, CultivoUbicacionSerializer
from .models import Cultivos, Etapa, CultivoSuelo, CultivoUbicacion
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
# Create your views here.

class CultivosAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo cultivos.
    """
    def get(self, request):
        cultivos = Cultivos.objects.all()
        serializer = CultivosSerializer(cultivos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CultivosSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class CultivosDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo cultivos.
    """
    def get(self, request, pk):
        try:
            cultivo = Cultivos.objects.get(pk=pk)
        except Cultivos.DoesNotExist:
            return Response({"error": "Cultivo not found"}, status=404)

        serializer = CultivosSerializer(cultivo)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            cultivo = Cultivos.objects.get(pk=pk)
        except Cultivos.DoesNotExist:
            return Response({"error": "Cultivo not found"}, status=404)

        serializer = CultivosSerializer(cultivo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    def delete(self, request, pk):
        try:
            cultivo = Cultivos.objects.get(pk=pk)
        except Cultivos.DoesNotExist:
            return Response({"error": "Cultivo not found"}, status=404)

        cultivo.delete()
        return Response(status=204)

class EtapaAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo etapas.
    """
    def get(self, request):
        etapas = Etapa.objects.all()
        serializer = EtapaSerializer(etapas, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EtapaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class EtapaDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo etapas.
    """
    def get(self, request, pk):
        try:
            etapa = Etapa.objects.get(pk=pk)
        except Etapa.DoesNotExist:
            return Response({"error": "Etapa not found"}, status=404)

        serializer = EtapaSerializer(etapa)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            etapa = Etapa.objects.get(pk=pk)
        except Etapa.DoesNotExist:
            return Response({"error": "Etapa not found"}, status=404)

        serializer = EtapaSerializer(etapa, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    def delete(self, request, pk):
        try:
            etapa = Etapa.objects.get(pk=pk)
        except Etapa.DoesNotExist:
            return Response({"error": "Etapa not found"}, status=404)

        etapa.delete()
        return Response(status=204)
    
class CultivoSueloListView(generics.ListAPIView):
    queryset = CultivoSuelo.objects.all()
    serializer_class = CultivoSueloSerializer

class CultivoUbicacionListView(generics.ListAPIView):
    queryset = CultivoUbicacion.objects.all()
    serializer_class = CultivoUbicacionSerializer
