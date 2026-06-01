from django.urls import path
from .views import (
    AdminLoginView,
    EmployeeLoginView,
    RegisterEmployeeView,
    EmployeeListView,
    EmployeeProfileView,
    EmployeeStatsView,
)

urlpatterns = [
    # Auth
    path('auth/admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/employee-login/', EmployeeLoginView.as_view(), name='employee-login'),

    # Employees (Admin)
    path('employees/', EmployeeListView.as_view(), name='employee-list'),
    path('employees/register/', RegisterEmployeeView.as_view(), name='register-employee'),
    path('employees/stats/', EmployeeStatsView.as_view(), name='employee-stats'),

    # Profile (Employee)
    path('profile/', EmployeeProfileView.as_view(), name='employee-profile'),
]
