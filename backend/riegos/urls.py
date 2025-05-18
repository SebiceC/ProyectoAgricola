from django.urls import path
from riegos.views import RiegosAPIView, RiegosDetailAPIView

urlpatterns = [
    path("riegos", RiegosAPIView.as_view(), name="riegos-list"),
    path("riegos/<int:pk>", RiegosDetailAPIView.as_view(), name="riegos-detail"),
]
