from rest_framework import generics, permissions
from .models import Soil
from .serializers import SoilSerializer
from django.db.models import Q


class SoilListCreateView(generics.ListCreateAPIView):
    serializer_class = SoilSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Soil.objects.filter(Q(user=self.request.user) | Q(user=None))

