from django.urls import path
from .views import CropListView, CropToPlantListCreateView

urlpatterns = [
    path('crops/', CropListView.as_view(), name='crop-list'),
    path('crops-plant/', CropToPlantListCreateView.as_view(), name='crop-plant-list-create'),
]

