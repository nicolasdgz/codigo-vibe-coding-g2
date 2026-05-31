from rest_framework.routers import DefaultRouter
from .views import RouteViewSet

app_name = 'routes'
router = DefaultRouter()
router.register(r'', RouteViewSet, basename='route')
urlpatterns = router.urls
