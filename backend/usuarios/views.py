from django.shortcuts import render
from .serializers import CustomUserSerializer, RolesSerializer
from .models import CustomUser, Roles
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET'])
def list_roles(request):
    roles = Roles.objects.all()
    serializer = RolesSerializer(roles, many=True)
    return Response(serializer.data)

def list_users(request):
    users = CustomUser.objects.all()
    serializer = CustomUserSerializer(users, many=True)
    return Response(serializer.data)
