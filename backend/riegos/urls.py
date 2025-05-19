from rest_framework import routers
from .api import RiegosViewSet

router = routers.DefaultRouter()

router.register("api/riego", RiegosViewSet, basename="riegos")

urlpatterns = router.urls