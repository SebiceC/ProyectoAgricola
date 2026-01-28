from django.urls import path
from .views import (
    StationListCreateView,
    StationDetailView,
    PrecipitationRecordListCreateView,
    PrecipitationRecordDetailView
)

urlpatterns = [
    # Gestión de Estaciones (Infraestructura)
    path('stations/', StationListCreateView.as_view(), name='station-list-create'),
    path('stations/<int:pk>/', StationDetailView.as_view(), name='station-detail'),
    
    # Gestión de Registros Diarios (Operación)
    # Esta ruta maneja tanto el GET (Lista) como el POST (Crear nueva lluvia)
    path('records/', PrecipitationRecordListCreateView.as_view(), name='record-list-create'),
    
    # Para borrar o editar un registro específico por ID
    path('records/<int:pk>/', PrecipitationRecordDetailView.as_view(), name='record-detail'),
]