from django.urls import path
from usuarios.views import RolesAPIView, CustomUserAPIView, RolesDetailAPIView, CustomUserDetailAPIView, CustomUserListView

urlpatterns = [
    path("roles", RolesAPIView.as_view(), name="roles-list"),
    path("roles/<int:pk>", RolesDetailAPIView.as_view(), name="roles-detail"),
    path("users", CustomUserAPIView.as_view(), name="users-list"),
    path("users/<int:pk>", CustomUserDetailAPIView.as_view(), name="users-detail"),
]
