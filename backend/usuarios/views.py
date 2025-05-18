from django.shortcuts import render
from .serializers import CustomUserSerializer, RolesSerializer
from .models import CustomUser, Roles
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics


class RolesAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo roles.
    """
    def get(self, request):
        roles = Roles.objects.all()
        serializer = RolesSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RolesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class RolesDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo roles.
    """
    def get(self, request, pk):
        try:
            role = Roles.objects.get(pk=pk)
        except Roles.DoesNotExist:
            return Response({"error": "Role not found"}, status=404)

        serializer = RolesSerializer(role)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            role = Roles.objects.get(pk=pk)
        except Roles.DoesNotExist:
            return Response({"error": "Role not found"}, status=404)

        serializer = RolesSerializer(role, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            role = Roles.objects.get(pk=pk)
        except Roles.DoesNotExist:
            return Response({"error": "Role not found"}, status=404)

        role.delete()
        return Response(status=204)

class CustomUserAPIView(APIView):
    """
    Esta clase maneja todas las operaciones CRUD para el modelo usuarios.
    """
    def get(self, request):
        users = CustomUser.objects.all()
        serializer = CustomUserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class CustomUserDetailAPIView(APIView):
    """
    Esta clase maneja las operaciones de detalle para el modelo usuarios.
    """
    def get(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        serializer = CustomUserSerializer(user)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        serializer = CustomUserSerializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        user.delete()
        return Response(status=204)
    
class CustomUserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer