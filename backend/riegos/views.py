from django.shortcuts import render
from .serializers import RiegosSerializer
from .models import Riegos
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics

class RiegosAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo riegos.
    """
    def get(self, request):
        riegos = Riegos.objects.all()
        serializer = RiegosSerializer(riegos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RiegosSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class RiegosDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo riegos.
    """
    def get(self, request, pk):
        try:
            riego = Riegos.objects.get(pk=pk)
        except Riegos.DoesNotExist:
            return Response({"error": "Riego not found"}, status=404)

        serializer = RiegosSerializer(riego)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            riego = Riegos.objects.get(pk=pk)
        except Riegos.DoesNotExist:
            return Response({"error": "Riego not found"}, status=404)

        serializer = RiegosSerializer(riego, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            riego = Riegos.objects.get(pk=pk)
        except Riegos.DoesNotExist:
            return Response({"error": "Riego not found"}, status=404)

        riego.delete()
        return Response(status=204)
