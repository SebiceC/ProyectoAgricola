from .models import Riegos
from rest_framework import viewsets, permissions
from .serializers import RiegosSerializer

class RiegosViewSet(viewsets.ModelViewSet):
    queryset = Riegos.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RiegosSerializer