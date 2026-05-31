from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet

app_name = 'shipments'
router = DefaultRouter()
router.register(r'', ShipmentViewSet, basename='shipment')
urlpatterns = router.urls
