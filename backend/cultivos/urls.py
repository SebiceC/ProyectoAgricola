from django.urls import path
from cultivos.views import CultivosAPIView, CultivosDetailAPIView, CultivoSueloListView, CultivoUbicacionListView
urlpatterns = [
    path("cultivos", CultivosAPIView.as_view(), name="cultivos-list"),
    path("cultivos/<int:pk>", CultivosDetailAPIView.as_view(), name="cultivos-detail"),
    path("cultivos/suelo/<int:suelo_id>", CultivoSueloListView.as_view(), name="cultivo-suelo-list"),
    path("cultivos/ubicacion/<int:ubicacion_id>", CultivoUbicacionListView.as_view(), name="cultivo-ubicacion-list"),
]

