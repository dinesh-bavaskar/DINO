from django.urls import path
from .views import (
    AdminLoginView,
    EmployeeLoginView,
    RegisterEmployeeView,
    EmployeeListView,
    EmployeeProfileView,
    EmployeeStatsView,
    EmployeeStatusView,
    EmployeeDetailView,
)

urlpatterns = [
    # Auth
    path('auth/admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/employee-login/', EmployeeLoginView.as_view(), name='employee-login'),

    # Employees (Admin)
    path('employees/', EmployeeListView.as_view(), name='employee-list'),
    path('employees/register/', RegisterEmployeeView.as_view(), name='register-employee'),
    path('employees/stats/', EmployeeStatsView.as_view(), name='employee-stats'),
    path('employees/<int:pk>/status/', EmployeeStatusView.as_view(), name='employee-status'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),

    # Profile (Employee)
    path('profile/', EmployeeProfileView.as_view(), name='employee-profile'),
]
