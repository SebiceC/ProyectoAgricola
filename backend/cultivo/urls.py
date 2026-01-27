from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Importa las nuevas clases ViewSet
from .views import CropViewSet, CropToPlantViewSet 

router = DefaultRouter()
# El router crea automáticamente todas las rutas (lista, detalle, patch, delete)
router.register(r'crops', CropViewSet, basename='crop')
router.register(r'plantings', CropToPlantViewSet, basename='planting')

urlpatterns = [
    path('', include(router.urls)),
]