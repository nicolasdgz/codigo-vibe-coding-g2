from django.contrib import admin
from django.urls import path, include
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]), name='swagger-ui'),
    path('api/v1/customers/', include('apps.customers.urls')),
    path('api/v1/warehouses/', include('apps.warehouses.urls')),
    path('api/v1/suppliers/', include('apps.suppliers.urls')),
    path('api/v1/products/', include('apps.products.urls')),
    path('api/v1/drivers/', include('apps.drivers.urls')),
    path('api/v1/transport/', include('apps.transport.urls')),
    path('api/v1/routes/', include('apps.routes.urls')),
    path('api/v1/shipments/', include('apps.shipments.urls')),
]
