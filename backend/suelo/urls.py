from django.urls import path
from .views import SoilListCreateView, SoilDetailView

urlpatterns = [
    # GET: Lista mis suelos | POST: Crea suelo
    path('soils/', SoilListCreateView.as_view(), name='soil-list-create'),
    
    # GET/PUT/DELETE: Gestiona un suelo específico por ID
    path('soils/<int:pk>/', SoilDetailView.as_view(), name='soil-detail'),
]