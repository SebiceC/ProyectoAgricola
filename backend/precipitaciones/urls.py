from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StationViewSet,
    PrecipitationRecordListCreateView,
    PrecipitationRecordDetailView
)

# Usamos Router para las Estaciones porque ahora es un ViewSet (necesario para @action fetch_chirps)
router = DefaultRouter()
router.register(r'stations', StationViewSet, basename='station')

urlpatterns = [
    # Incluye las rutas generadas por el router (api/precipitaciones/stations/...)
    path('', include(router.urls)),
    
    # Gestión de Registros Diarios (Mantenemos las vistas genéricas para esto)
    path('records/', PrecipitationRecordListCreateView.as_view(), name='record-list-create'),
    
    # Para borrar o editar un registro específico por ID
    path('records/<int:pk>/', PrecipitationRecordDetailView.as_view(), name='record-detail'),
]