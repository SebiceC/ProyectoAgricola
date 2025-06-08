from rest_framework import routers
from .api import UbicacionViewSet, SueloViewSet, PrecipitacionViewSet, EtoViewSet, EvapotranspirationViewSet
router = routers.DefaultRouter()

router.register("api/ubicacion", UbicacionViewSet, basename="ubicacion")
router.register("api/suelo", SueloViewSet, basename="suelo")
router.register("api/precipitacion", PrecipitacionViewSet, basename="precipitacion")
router.register("api/eto", EtoViewSet, basename="eto")
router.register("api/evapotranspiracion", EvapotranspirationViewSet, basename="evapotranspiracion")


urlpatterns = router.urls