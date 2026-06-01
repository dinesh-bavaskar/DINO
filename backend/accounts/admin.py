from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'email', 'department', 'designation', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'department', 'is_active']
    search_fields = ['employee_id', 'full_name', 'email']
    ordering = ['-created_at']
