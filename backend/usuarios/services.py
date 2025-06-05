from datetime import datetime, timedelta
import jwt
from django.conf import settings
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

class AuthService:
    @staticmethod
    def generate_tokens(user):
        """
        Genera tokens de acceso y refresh para un usuario
        """
        refresh = RefreshToken.for_user(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'groups': list(user.groups.values_list('name', flat=True))  # Lista de nombres de grupos
            }
        }

    @staticmethod
    def verify_token(token):
        """
        Verifica si un token es válido
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    @staticmethod
    def refresh_access_token(refresh_token):
        """
        Genera un nuevo token de acceso usando un refresh token
        """
        try:
            refresh = RefreshToken(refresh_token)
            return {
                'access': str(refresh.access_token)
            }
        except Exception:
            return None

    @staticmethod
    def blacklist_token(token):
        """
        Añade un token a la lista negra (logout)
        """
        try:
            refresh = RefreshToken(token)
            refresh.blacklist()
            return True
        except Exception:
            return False

    @staticmethod
    def is_token_blacklisted(token):
        """
        Verifica si un token está en la lista negra
        """
        try:
            return BlacklistedToken.objects.filter(token__token=token).exists()
        except Exception:
            return False

    @staticmethod
    def store_user_session(user_id, session_data):
        """
        Almacena datos de sesión en caché
        """
        cache_key = f'user_session_{user_id}'
        cache.set(cache_key, session_data, timeout=86400)  # 24 horas

    @staticmethod
    def get_user_session(user_id):
        """
        Obtiene datos de sesión de caché
        """
        cache_key = f'user_session_{user_id}'
        return cache.get(cache_key)

    @staticmethod
    def clear_user_session(user_id):
        """
        Limpia datos de sesión de caché
        """
        cache_key = f'user_session_{user_id}'
        cache.delete(cache_key) 