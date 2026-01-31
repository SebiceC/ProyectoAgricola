from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DailyWeatherViewSet, IrrigationSettingsViewSet

router = DefaultRouter()
router.register(r'weather', DailyWeatherViewSet, basename='weather')
router.register(r'settings', IrrigationSettingsViewSet, basename='settings')

urlpatterns = [
    path('', include(router.urls)),
]