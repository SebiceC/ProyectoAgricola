from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import Group
from .serializers import CustomUserSerializer
from .models import CustomUser
from .serializers import CustomUserSerializer, ChangePasswordSerializer, CustomUserLoginSerializer
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema

@extend_schema(
    request=CustomUserSerializer,
    responses={201: CustomUserSerializer}
)
class CustomUserRegisterView(GenericAPIView):
    permission_classes = []

    serializer_class = CustomUserSerializer
    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        group, created = Group.objects.get_or_create(name="usuario")
        user.groups.add(group)
        return Response(CustomUserSerializer(user).data, status=status.HTTP_201_CREATED)

    
class CustomUserLoginView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = CustomUserLoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(request, username=email, password=password)
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "message": "Login successful",
                "token": token.key,
                "user_id": user.id,
                "email": user.email,
            }, status=status.HTTP_200_OK)

        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )
        
class ChangePasswordView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        validate_password(serializer.validated_data['new_password'], user)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)
