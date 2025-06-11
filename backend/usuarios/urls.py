from django.urls import path
from .views import UserViewSet


urlpatterns = [
    path('api/login/', UserViewSet.as_view({'post': 'login'}), name='api-login'),
    path('api/register/', UserViewSet.as_view({'post': 'register'}), name='api-register'),
    path('api/verify-otp/', UserViewSet.as_view({'post': 'verify_otp'}), name='api-verify-otp'),
    path('api/refresh-token/', UserViewSet.as_view({'post': 'refresh_token'}), name='api-refresh-token'),
    path('api/logout/', UserViewSet.as_view({'post': 'logout'}), name='api-logout'),
    path('api/session-status/', UserViewSet.as_view({'get': 'session_status'}), name='api-session-status'),
    path('api/users/', UserViewSet.as_view({'get':'list_users'}), name='api-list-users'),
    path('api/users/<int:pk>/', UserViewSet.as_view({'get':'list_user_by_id'}), name='api-user-detail'),
    path('api/users/<int:pk>/update/', UserViewSet.as_view({'put':'update_user'}), name='api-update-user'),
    path('api/users/<int:pk>/delete/', UserViewSet.as_view({'delete':'delete_user'}), name='api-delete-user'),

]
