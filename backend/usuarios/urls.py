from rest_framework import routers
from .api import RolesViewSet, CustomUserViewSet


router = routers.DefaultRouter()

router.register("api/roles", RolesViewSet, "roles")
router.register("api/usuarios", CustomUserViewSet, "usuarios")

urlpatterns = router.urls