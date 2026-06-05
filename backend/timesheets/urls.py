from django.urls import path

from .views import (
    AdminTimesheetDetailView,
    AdminTimesheetListView,
    AdminTimesheetReviewView,
    AdminProjectDetailView,
    ActiveProjectListView,
    AdminProjectListCreateView,
    DashboardSummaryView,
    TimesheetDetailView,
    TimesheetListCreateView,
    TimesheetSubmitView,
    TodayTimesheetView,
)

urlpatterns = [
    path('projects/', ActiveProjectListView.as_view(), name='project-list'),
    path('admin/projects/', AdminProjectListCreateView.as_view(), name='admin-project-list-create'),
    path('admin/projects/<int:pk>/', AdminProjectDetailView.as_view(), name='admin-project-detail'),
    path('timesheets/', TimesheetListCreateView.as_view(), name='timesheet-create'),
    path('timesheets/today/', TodayTimesheetView.as_view(), name='timesheet-today'),
    path('timesheets/<int:pk>/', TimesheetDetailView.as_view(), name='timesheet-detail'),
    path('timesheets/<int:pk>/submit/', TimesheetSubmitView.as_view(), name='timesheet-submit'),
    path('admin/timesheets/', AdminTimesheetListView.as_view(), name='admin-timesheet-list'),
    path('admin/timesheets/<int:pk>/', AdminTimesheetDetailView.as_view(), name='admin-timesheet-detail'),
    path('admin/timesheets/<int:pk>/review/', AdminTimesheetReviewView.as_view(), name='admin-timesheet-review'),
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]
