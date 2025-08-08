from rest_framework import routers
from .views import CultivosViewSet, EtapaViewSet

router = routers.DefaultRouter()

router.register("api/cultivos", CultivosViewSet, basename="cultivos")
router.register("api/etapa", EtapaViewSet, basename="etapa")


urlpatterns = router.urls
