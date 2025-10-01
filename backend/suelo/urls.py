from django.urls import path
from .views import SoilListCreateView

urlpatterns = [
    path('soils/', SoilListCreateView.as_view(), name='soil-list-create'),
]
