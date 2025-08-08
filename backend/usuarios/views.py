from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework_simplejwt.authentication import JWTAuthentication
from .serializers import (
    UserRegisterSerializer,
    LoginSerializer,
    OTPVerificationSerializer,
)
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from .models import UserOTP, CustomUser
from django.utils import timezone
from datetime import timedelta
from .services import AuthService
from django.core.cache import cache
import random
import string
from django.conf import settings
import requests
from django.contrib.auth.models import Group

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar todas las operaciones relacionadas con usuarios.
    """

    queryset = CustomUser.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        """
        Permite acceso público a registro y login.
        """
        if self.action in ["register", "login", "verify_otp"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"])
    def register(self, request):
        """
        Registra un nuevo usuario.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                return Response(
                    {
                        "status": "success",
                        "message": "Usuario registrado exitosamente",
                        "data": {
                            "id": user.id,
                            "email": user.email,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                        },
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                return Response(
                    {
                        "status": "error",
                        "message": "Error al crear el usuario",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        return Response(
            {
                "status": "error",
                "message": "Error de validación",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=False, methods=["post"])
    def login(self, request):
        """
        Inicia sesión y envía código OTP.
        """
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            print(f"Autenticando: email={email}, password={password}")
            user = authenticate(username=email, password=password)
            print("Usuario encontrado:", user)

            if user:
                if user.is_active:
                    # Generar y enviar OTP
                    otp = UserOTP.generate_otp()
                    UserOTP.objects.create(
                        user=user,
                        code=otp,
                        expires_at=timezone.now() + timedelta(minutes=5),
                    )

                    # Enviar OTP por correo
                    try:
                        send_mail(
                            "Código de verificación ETFlow",
                            f"Tu código de verificación es: {otp}",
                            settings.EMAIL_HOST_USER,
                            [email],
                            fail_silently=False,
                        )
                        return Response(
                            {
                                "status": "success",
                                "message": "Código OTP enviado exitosamente",
                                "data": {"email": email},
                            },
                            status=status.HTTP_200_OK,
                        )
                    except Exception as e:
                        return Response(
                            {
                                "status": "error",
                                "message": "Error al enviar el código OTP",
                                "error": str(e),
                            },
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        )
                else:
                    return Response(
                        {"status": "error", "message": "La cuenta está desactivada"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            else:
                return Response(
                    {"status": "error", "message": "Credenciales inválidas"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        return Response(
            {
                "status": "error",
                "message": "Error de validación",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=False, methods=["post"])
    def verify_otp(self, request):
        """
        Verifica el código OTP y genera tokens.
        """
        serializer = OTPVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp = serializer.validated_data["otp"]

            try:
                user = CustomUser.objects.get(email=email)
                otp_obj = UserOTP.objects.filter(
                    user=user, code=otp, expires_at__gt=timezone.now()
                ).latest("created_at")

                if otp_obj:
                    # Generar tokens JWT
                    from rest_framework_simplejwt.tokens import RefreshToken

                    refresh = RefreshToken.for_user(user)
                    groups = list(user.groups.values_list("name", flat=True))

                    # Eliminar OTP usado
                    otp_obj.delete()

                    return Response(
                        {
                            "status": "success",
                            "message": "Verificación exitosa",
                            "data": {
                                "access_token": str(refresh.access_token),
                                "refresh_token": str(refresh),
                                "user": {
                                    "id": user.id,
                                    "email": user.email,
                                    "first_name": user.first_name,
                                    "last_name": user.last_name,
                                    "role": groups,
                                },
                            },
                        },
                        status=status.HTTP_200_OK,
                    )
            except CustomUser.DoesNotExist:
                return Response(
                    {"status": "error", "message": "Usuario no encontrado"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            except UserOTP.DoesNotExist:
                return Response(
                    {"status": "error", "message": "Código OTP inválido o expirado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except Exception as e:
                return Response(
                    {
                        "status": "error",
                        "message": "Error en la verificación",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {
                "status": "error",
                "message": "Error de validación",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def logout(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response(
                    {
                        "status": "error",
                        "message": "Token de actualización no proporcionado",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            from rest_framework_simplejwt.tokens import RefreshToken

            try:
                token = RefreshToken(refresh_token)
                token.blacklist()

                # Limpiar cualquier token almacenado en el cliente
                response = Response(
                    {"status": "success", "message": "Sesión cerrada exitosamente"},
                    status=status.HTTP_200_OK,
                )

                # Opcional: Incluir headers para limpiar tokens en el cliente
                response["Authorization"] = ""
                return response

            except Exception as e:
                return Response(
                    {
                        "status": "error",
                        "message": "Token inválido o expirado",
                        "error": str(e),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            return Response(
                {
                    "status": "error",
                    "message": "Error al cerrar sesión",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def session_status(self, request):
        """
        Verifica el estado de la sesión actual.
        """
        if request.user.is_authenticated:
            groups = request.user.groups.all()
            grupo = groups[0] if groups else None
            return Response(
                {
                    "status": "success",
                    "message": "Sesión activa",
                    "data": {
                        "user": {
                            "id": request.user.id,
                            "email": request.user.email,
                            "first_name": request.user.first_name,
                            "last_name": request.user.last_name,
                            "role": grupo.name if groups else None,
                        }
                    },
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"status": "error", "message": "No hay sesión activa"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def list_users(self, request):
        """
        Lista todos los usuarios
        """
        if not request.user.groups.filter(name="Administrador").exists():

            return Response(
                {
                    "status": "error",
                    "message": "No tienes permiso para realizar esta acción",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        users = CustomUser.objects.all()
        serializer = self.get_serializer(users, many=True)
        return Response(
            {"status": "success", "data": serializer.data}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def list_user_by_id(self, request, pk=None):
        try:
            user = CustomUser.objects.get(pk=pk)
            serializer = self.get_serializer(user)
            return Response(
                {"status": "success", "data": serializer.data},
                status=status.HTTP_200_OK,
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"status": "error", "message": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=["put"], permission_classes=[IsAuthenticated])
    def update_user(self, request, pk=None):
        """
        Actualiza un usuario existente
        """
        try:
            user = CustomUser.objects.get(pk=pk)

            # Solo el propio usuario o un admin puede actualizar
            if request.user != user:
                return Response(
                    {
                        "status": "error",
                        "message": "Solo puedes actualizar tu propio perfil",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {
                        "status": "success",
                        "message": "Usuario actualizado exitosamente",
                        "data": serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {
                    "status": "error",
                    "message": "Error de validación",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"status": "error", "message": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=["delete"], permission_classes=[IsAuthenticated])
    def delete_user(self, request, pk=None):
        """
        Elimina un usuario (solo para administradores)
        """
        if not request.user.groups.filter(name="Administrador").exists():

            return Response(
                {
                    "status": "error",
                    "message": "No tienes permiso para realizar esta acción",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = CustomUser.objects.get(pk=pk)
            user.delete()
            return Response(
                {"status": "success", "message": "Usuario eliminado exitosamente"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"status": "error", "message": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )
