from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import calculate_eto_from_nasa, available_methods
"""from .views import DailyMetereologicalDataViewSet, MetereologicalSummaryViewSet, EtoCalculatedViewSet
"""
"""router = DefaultRouter()
router.register(r'daily-data', DailyMetereologicalDataViewSet)
router.register(r'monthly-data', MetereologicalSummaryViewSet)
router.register(r'eto-calculated', EtoCalculatedViewSet)

urlpatterns = [
    path('', include(router.urls)),
]"""

urlpatterns = [
    path('calculate-eto/', calculate_eto_from_nasa, name='calculate-eto'),
    path('available-methods/', available_methods, name='available-methods'),
]
