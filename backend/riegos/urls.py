from rest_framework import routers
from .views import RiegosViewSet

router = routers.DefaultRouter()

router.register("api/riego", RiegosViewSet, basename="riegos")

urlpatterns = router.urls
