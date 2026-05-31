from rest_framework.permissions import BasePermission


class IsAdminOrWarehouseStaff(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        return request.user.groups.filter(name__in=['admin', 'warehouse_staff']).exists()
