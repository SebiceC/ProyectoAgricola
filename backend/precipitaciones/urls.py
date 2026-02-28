from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StationViewSet,
    PrecipitationRecordListCreateView,
    PrecipitationRecordDetailView,
    PrecipitationStudyViewSet
)

# Usamos Router para las Estaciones y Estudios
router = DefaultRouter()
router.register(r'stations', StationViewSet, basename='station')
router.register(r'studies', PrecipitationStudyViewSet, basename='precipitation-study')

urlpatterns = [
    # Incluye las rutas generadas por el router (api/precipitaciones/stations/...)
    path('', include(router.urls)),
    
    # Gestión de Registros Diarios (Mantenemos las vistas genéricas para esto)
    path('records/', PrecipitationRecordListCreateView.as_view(), name='record-list-create'),
    
    # Para borrar o editar un registro específico por ID
    path('records/<int:pk>/', PrecipitationRecordDetailView.as_view(), name='record-detail'),
]