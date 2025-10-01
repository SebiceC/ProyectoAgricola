from rest_framework import generics, permissions
from .models import Crop, CropToPlant
from .serializers import CropSerializer, CropToPlantSerializer

class CropListView(generics.ListAPIView):
    queryset = Crop.objects.all()
    serializer_class = CropSerializer
    permission_classes = [permissions.IsAuthenticated]

class CropToPlantListCreateView(generics.ListCreateAPIView):
    serializer_class = CropToPlantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CropToPlant.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
