from django.urls import path
from ubicaciones.views import UbicacionAPIView, UbicacionDetailAPIView, SueloAPIView, SueloDetailAPIView, PrecipitacionAPIView, PrecipitacionDetailAPIView, EtoAPIView, EtoDetailAPIView

urlpatterns = [
    path("ubicaciones", UbicacionAPIView.as_view(), name="ubicaciones-list"),
    path("ubicaciones/<int:pk>", UbicacionDetailAPIView.as_view(), name="ubicaciones-detail"),
    path("suelo", SueloAPIView.as_view(), name="suelo-list"),
    path("suelo/<int:pk>", SueloDetailAPIView.as_view(), name="suelo-detail"),
    path("precipitacion", PrecipitacionAPIView.as_view(), name="precipitacion-list"),
    path("precipitacion/<int:pk>", PrecipitacionDetailAPIView.as_view(), name="precipitacion-detail"),
    path("eto", EtoAPIView.as_view(), name="eto-list"),
    path("eto/<int:pk>", EtoDetailAPIView.as_view(), name="eto-detail"),
]
