from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allow access only to employees with role='admin'."""
    message = "Access denied. Admin role required."

    def has_permission(self, request, view):
        return bool(
            request.auth and
            hasattr(request, 'employee') and
            request.employee.role == 'admin'
        )


class IsEmployeeRole(BasePermission):
    """Allow access only to employees with role='employee'."""
    message = "Access denied. Employee role required."

    def has_permission(self, request, view):
        return bool(
            request.auth and
            hasattr(request, 'employee')
        )
