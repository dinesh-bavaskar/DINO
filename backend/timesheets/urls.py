from django.urls import path

from .views import (
    AdminMilestoneDetailView,
    AdminMilestoneListCreateView,
    AdminTimesheetDetailView,
    AdminTimesheetListView,
    AdminTimesheetReviewView,
    AdminProjectDetailView,
    ActiveMilestoneListView,
    ActiveProjectListView,
    AdminProjectListCreateView,
    DashboardSummaryView,
    TimesheetDetailView,
    TimesheetListCreateView,
    TimesheetSubmitView,
    TodayTimesheetView,
    TimesheetSettingView,
    AdminTimesheetSettingView,
)

urlpatterns = [
    path('projects/', ActiveProjectListView.as_view(), name='project-list'),
    path('milestones/', ActiveMilestoneListView.as_view(), name='milestone-list'),
    path('admin/projects/', AdminProjectListCreateView.as_view(), name='admin-project-list-create'),
    path('admin/projects/<int:pk>/', AdminProjectDetailView.as_view(), name='admin-project-detail'),
    path('admin/milestones/', AdminMilestoneListCreateView.as_view(), name='admin-milestone-list-create'),
    path('admin/milestones/<int:pk>/', AdminMilestoneDetailView.as_view(), name='admin-milestone-detail'),
    path('timesheets/', TimesheetListCreateView.as_view(), name='timesheet-create'),
    path('timesheets/today/', TodayTimesheetView.as_view(), name='timesheet-today'),
    path('timesheets/<int:pk>/', TimesheetDetailView.as_view(), name='timesheet-detail'),
    path('timesheets/<int:pk>/submit/', TimesheetSubmitView.as_view(), name='timesheet-submit'),
    path('admin/timesheets/', AdminTimesheetListView.as_view(), name='admin-timesheet-list'),
    path('admin/timesheets/<int:pk>/', AdminTimesheetDetailView.as_view(), name='admin-timesheet-detail'),
    path('admin/timesheets/<int:pk>/review/', AdminTimesheetReviewView.as_view(), name='admin-timesheet-review'),
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('timesheet-settings/', TimesheetSettingView.as_view(), name='timesheet-settings'),
    path('admin/timesheet-settings/', AdminTimesheetSettingView.as_view(), name='admin-timesheet-settings'),
]
