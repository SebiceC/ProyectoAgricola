from django.shortcuts import render
from .serializers import CustomUserSerializer
from .models import CustomUser
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated


# Create your views here.
class CustomUserListCreateView(ListCreateAPIView):
    allowed_methods = ['GET', 'POST']
    serializer_class = CustomUserSerializer
    queryset = CustomUser.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    

class CustomUserRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    allowed_methods = ['GET', 'PUT', 'PATCH', 'DELETE']
    serializer_class = CustomUserSerializer
    queryset = CustomUser.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]