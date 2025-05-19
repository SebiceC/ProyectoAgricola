from rest_framework import routers
from .api import CultivosViewSet, EtapaViewSet, CultivoSueloViewSet, CultivoUbicacionViewSet

router = routers.DefaultRouter()

router.register("api/cultivos", CultivosViewSet, basename="cultivos")
router.register("api/etapa", EtapaViewSet, basename="etapa")
router.register("api/cultivosuelo", CultivoSueloViewSet, basename="cultivosuelo")
router.register("api/cultivoubicacion", CultivoUbicacionViewSet, basename="cultivoubicacion")


urlpatterns = router.urls