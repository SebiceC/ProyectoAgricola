from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DailyWeatherViewSet, IrrigationSettingsViewSet, ClimateStudyViewSet

router = DefaultRouter()
router.register(r'weather', DailyWeatherViewSet, basename='weather')
router.register(r'settings', IrrigationSettingsViewSet, basename='settings')
router.register(r'studies', ClimateStudyViewSet, basename='climate-studies')

urlpatterns = [
    path('', include(router.urls)),
]