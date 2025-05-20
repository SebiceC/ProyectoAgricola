<<<<<<< HEAD
from rest_framework import routers
from .api import RolesViewSet, CustomUserViewSet


router = routers.DefaultRouter()

router.register("api/roles", RolesViewSet, "roles")
router.register("api/usuarios", CustomUserViewSet, "usuarios")

urlpatterns = router.urls
=======
from django.urls import path
from .views import (
    UserRegisterAPIView,
    LoginWithOTPAPIView,
    VerifyOTPAPIView,
    RefreshTokenAPIView,
    LogoutAPIView,
    SessionStatusAPIView
)

urlpatterns = [
    path('registro/', UserRegisterAPIView.as_view(), name='registro'),
    path('login/', LoginWithOTPAPIView.as_view(), name='login-otp'),
    path('verify-otp/', VerifyOTPAPIView.as_view(), name='verify-otp'),
    path('refresh-token/', RefreshTokenAPIView.as_view(), name='refresh-token'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('session-status/', SessionStatusAPIView.as_view(), name='session-status'),
] 
>>>>>>> 52e6676 (feat: actualiza requirements.txt y configura manejo de finales de línea)
