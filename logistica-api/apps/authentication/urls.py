from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    GroupDetailView,
    GroupListCreateView,
    MeView,
    PermissionListView,
    UserDetailView,
    UserListCreateView,
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('users/', UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('groups/', GroupListCreateView.as_view(), name='group_list_create'),
    path('groups/<int:pk>/', GroupDetailView.as_view(), name='group_detail'),
    path('permissions/', PermissionListView.as_view(), name='permission_list'),
]
