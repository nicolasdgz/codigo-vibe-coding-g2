from rest_framework.routers import DefaultRouter
from .views import TransportViewSet

app_name = 'transport'
router = DefaultRouter()
router.register(r'', TransportViewSet, basename='transport')
urlpatterns = router.urls
