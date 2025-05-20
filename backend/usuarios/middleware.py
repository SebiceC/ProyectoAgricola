from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from .services import AuthService
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.utils.functional import SimpleLazyObject
from django.contrib.auth.middleware import get_user
from django.contrib.auth.models import AnonymousUser

class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        """
        Procesa cada request y añade el usuario autenticado si el token es válido
        """
        # Lista de rutas que no requieren autenticación
        public_paths = [
            '/api/login/',
            '/api/registro/',
            '/api/verify-otp/',
            '/api/refresh-token/',
        ]

        # Si la ruta es pública, no verificamos el token
        if request.path in public_paths:
            return None

        # Obtener el token del header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        
        # Verificar si el token está en la lista negra
        if AuthService.is_token_blacklisted(token):
            return None

        # Verificar el token
        try:
            jwt_auth = JWTAuthentication()
            user_auth_tuple = jwt_auth.authenticate(request)
            if user_auth_tuple is not None:
                request.user, request.auth = user_auth_tuple
        except (InvalidToken, TokenError):
            return None

        request.user = SimpleLazyObject(lambda: self.__class__.get_jwt_user(request))
        return None

    @staticmethod
    def get_jwt_user(request):
        user = get_user(request)
        if user.is_authenticated:
            return user
        
        jwt_authentication = JWTAuthentication()
        if jwt_authentication.get_header(request):
            try:
                user_auth_tuple = jwt_authentication.authenticate(request)
                if user_auth_tuple is not None:
                    return user_auth_tuple[0]
            except Exception:
                pass
        return AnonymousUser() 