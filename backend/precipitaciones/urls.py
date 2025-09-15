from django.urls import path
from .views import (
    StationListCreateView,
    StationDetailView,
    CargarPrecipitacionesAnioView,
    PrecipitationRecordYearListView,
    PrecipitacionDiariaRangoView
)

urlpatterns = [
    path('stations/', StationListCreateView.as_view(), name='station-list-create'),
    path('stations/<int:pk>/', StationDetailView.as_view(), name='station-detail'),
    path('precipitations/cargar/', CargarPrecipitacionesAnioView.as_view(), name='precipitacion-cargar'),
    path('precipitations/', PrecipitationRecordYearListView.as_view(), name='precipitacion-year-list'),
    path('precipitations/diaria/rango/', PrecipitacionDiariaRangoView.as_view(), name='precipitacion-diaria-rango'),
]
