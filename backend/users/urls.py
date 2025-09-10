from django.contrib import admin
from django.urls import path
from .views import CustomUserListCreateView, CustomUserRetrieveUpdateDestroyView
from .auth import CustomUserLoginView, CustomUserRegisterView, ChangePasswordView

urlpatterns = [
    path('users/register/', CustomUserRegisterView.as_view(), name='register'),
    path('users/login/', CustomUserLoginView.as_view(), name='login'),
    path('users/change-password/', ChangePasswordView.as_view(), name='change_password'),
    # Users Crud
    path('users/', CustomUserListCreateView.as_view(), name="user-list-create"),
    path('users/<int:pk>/', CustomUserRetrieveUpdateDestroyView.as_view(), name="user-detail"),
    
]