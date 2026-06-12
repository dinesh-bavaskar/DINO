from decimal import Decimal

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Employee
from .models import DailyReport, Milestone, Project, Timesheet, TimesheetSetting
from .serializers import (
    DAILY_HOUR_LIMIT,
    DailyReportSerializer,
    MilestoneSerializer,
    ProjectSerializer,
    TimesheetReviewSerializer,
    TimesheetSerializer,
    TimesheetSubmitSerializer,
    TimesheetSettingSerializer,
)


class StandardResultsPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


def paginated_response(request, queryset, serializer_class):
    paginator = StandardResultsPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(page, many=True)
    return paginator.get_paginated_response(serializer.data)


def get_request_employee(request):
    token = request.auth
    employee_id = token.get('employee_id') if hasattr(token, 'get') else None
    if not employee_id or employee_id == 'ADMIN':
        return None
    try:
        return Employee.objects.get(employee_id=employee_id, role='employee', is_active=True)
    except Employee.DoesNotExist:
        return None


def decimal_hours(value):
    return float((value or Decimal('0.00')).quantize(Decimal('0.01')))


def is_admin_request(request):
    return bool(
        getattr(request.user, 'is_superuser', False) or
        (hasattr(request.auth, 'get') and request.auth.get('role') == 'admin')
    )


class EmployeeOnlyMixin:
    permission_classes = [IsAuthenticated]

    def get_employee_or_response(self, request):
        employee = get_request_employee(request)
        if not employee:
            return None, Response(
                {'detail': 'Active employee access required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return employee, None


class AdminOnlyMixin:
    permission_classes = [IsAuthenticated]

    def get_admin_error(self, request):
        if is_admin_request(request):
            return None
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)


class ActiveProjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = Project.objects.filter(is_active=True)
        return Response(ProjectSerializer(projects, many=True).data)


class AdminProjectListCreateView(AdminOnlyMixin, APIView):
    def get(self, request):
        error = self.get_admin_error(request)
        if error:
            return error
        return Response(ProjectSerializer(Project.objects.all(), many=True).data)

    def post(self, request):
        error = self.get_admin_error(request)
        if error:
            return error
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminProjectDetailView(AdminOnlyMixin, APIView):
    def patch(self, request, pk):
        error = self.get_admin_error(request)
        if error:
            return error
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        error = self.get_admin_error(request)
        if error:
            return error
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActiveMilestoneListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get('project_id')
        milestones = Milestone.objects.filter(is_active=True).select_related('project')
        if project_id:
            milestones = milestones.filter(project_id=project_id)
        return Response(MilestoneSerializer(milestones, many=True).data)


class AdminMilestoneListCreateView(AdminOnlyMixin, APIView):
    def get(self, request):
        error = self.get_admin_error(request)
        if error:
            return error
        project_id = request.query_params.get('project_id')
        milestones = Milestone.objects.all().select_related('project')
        if project_id:
            milestones = milestones.filter(project_id=project_id)
        return Response(MilestoneSerializer(milestones, many=True).data)

    def post(self, request):
        error = self.get_admin_error(request)
        if error:
            return error
        serializer = MilestoneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminMilestoneDetailView(AdminOnlyMixin, APIView):
    def patch(self, request, pk):
        error = self.get_admin_error(request)
        if error:
            return error
        try:
            milestone = Milestone.objects.get(pk=pk)
        except Milestone.DoesNotExist:
            return Response({'detail': 'Milestone not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MilestoneSerializer(milestone, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        error = self.get_admin_error(request)
        if error:
            return error
        try:
            milestone = Milestone.objects.get(pk=pk)
        except Milestone.DoesNotExist:
            return Response({'detail': 'Milestone not found.'}, status=status.HTTP_404_NOT_FOUND)
        milestone.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TimesheetListCreateView(EmployeeOnlyMixin, APIView):
    def post(self, request):
        employee, error = self.get_employee_or_response(request)
        if error:
            return error
        serializer = TimesheetSerializer(data=request.data, context={'employee': employee, 'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TodayTimesheetView(EmployeeOnlyMixin, APIView):
    def get(self, request):
        employee, error = self.get_employee_or_response(request)
        if error:
            return error
        entries = Timesheet.objects.filter(daily_report__employee=employee, daily_report__date=timezone.localdate())
        return Response(TimesheetSerializer(entries, many=True).data)


class TimesheetDetailView(EmployeeOnlyMixin, APIView):
    def get_object(self, employee, pk):
        try:
            return Timesheet.objects.get(pk=pk, daily_report__employee=employee)
        except Timesheet.DoesNotExist:
            return None

    def put(self, request, pk):
        employee, error = self.get_employee_or_response(request)
        if error:
            return error
        entry = self.get_object(employee, pk)
        if not entry:
            return Response({'detail': 'Timesheet entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TimesheetSerializer(entry, data=request.data, context={'employee': employee, 'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        employee, error = self.get_employee_or_response(request)
        if error:
            return error
        entry = self.get_object(employee, pk)
        if not entry:
            return Response({'detail': 'Timesheet entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TimesheetSubmitView(EmployeeOnlyMixin, APIView):
    def post(self, request, pk):
        employee, error = self.get_employee_or_response(request)
        if error:
            return error
        try:
            entry = Timesheet.objects.get(pk=pk, daily_report__employee=employee)
        except Timesheet.DoesNotExist:
            return Response({'detail': 'Timesheet entry not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TimesheetSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        next_status = serializer.validated_data['status']
        report = entry.daily_report
        report.status = next_status
        if next_status == Timesheet.STATUS_SUBMITTED:
            if not report.submitted_at:
                report.submitted_at = timezone.now()
        elif next_status == Timesheet.STATUS_DRAFT:
            report.submitted_at = None
            report.reviewed_at = None
            report.review_comments = ''
        report.save()
        return Response(TimesheetSerializer(entry).data)


class DashboardSummaryView(EmployeeOnlyMixin, APIView):
    def get(self, request):
        employee, error = self.get_employee_or_response(request)
        if error:
            return error
        entries = Timesheet.objects.filter(daily_report__employee=employee, daily_report__date=timezone.localdate())
        logged = entries.aggregate(total=Sum('actual_hours'))['total'] or Decimal('0.00')
        remaining = max(DAILY_HOUR_LIMIT - logged, Decimal('0.00'))
        return Response({
            'logged_hours': decimal_hours(logged),
            'remaining_hours': decimal_hours(remaining),
            'total_tasks': entries.count(),
            'current_date': timezone.localdate().isoformat(),
        })


class AdminTimesheetListView(AdminOnlyMixin, APIView):
    def get(self, request):
        error = self.get_admin_error(request)
        if error:
            return error

        reports = DailyReport.objects.prefetch_related(
            'tasks__project',
            'tasks__milestone',
        ).select_related('employee').all().order_by('-date', '-updated_at')
        employee = request.query_params.get('employee')
        date_from = request.query_params.get('date')
        date_to = request.query_params.get('dateTo')
        project_id = request.query_params.get('projectId')
        project_name = request.query_params.get('project')
        status_filter = request.query_params.get('status')

        if employee:
            reports = reports.filter(
                Q(employee__employee_id__icontains=employee) |
                Q(employee__full_name__icontains=employee) |
                Q(employee__email__icontains=employee)
            )
        # Date range filtering
        if date_from:
            reports = reports.filter(date__gte=date_from)
        if date_to:
            reports = reports.filter(date__lte=date_to)
        # Project filter by ID
        if project_id:
            reports = reports.filter(tasks__project__id=project_id)
        if project_name:
            reports = reports.filter(tasks__project__name__icontains=project_name)
        if status_filter:
            reports = reports.filter(status=status_filter)

        return paginated_response(request, reports.distinct(), DailyReportSerializer)


class AdminTimesheetDetailView(AdminOnlyMixin, APIView):
    def get(self, request, pk):
        error = self.get_admin_error(request)
        if error:
            return error
        try:
            report = DailyReport.objects.prefetch_related(
                'tasks__project',
                'tasks__milestone',
            ).select_related('employee').get(pk=pk)
        except DailyReport.DoesNotExist:
            try:
                entry = Timesheet.objects.select_related('daily_report').get(pk=pk)
                report = DailyReport.objects.prefetch_related(
                    'tasks__project',
                    'tasks__milestone',
                ).select_related('employee').get(pk=entry.daily_report_id)
            except Timesheet.DoesNotExist:
                return Response({'detail': 'Daily report not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(DailyReportSerializer(report).data)

    def put(self, request, pk):
        error = self.get_admin_error(request)
        if error:
            return error
        try:
            report = DailyReport.objects.prefetch_related(
                'tasks__project',
                'tasks__milestone',
            ).select_related('employee').get(pk=pk)
        except DailyReport.DoesNotExist:
            try:
                entry = Timesheet.objects.select_related('daily_report').get(pk=pk)
                report = DailyReport.objects.prefetch_related(
                    'tasks__project',
                    'tasks__milestone',
                ).select_related('employee').get(pk=entry.daily_report_id)
            except Timesheet.DoesNotExist:
                return Response({'detail': 'Daily report not found.'}, status=status.HTTP_404_NOT_FOUND)

        tasks_data = request.data.get('tasks', [])
        for task_data in tasks_data:
            task_id = task_data.get('id')
            try:
                task = report.tasks.get(pk=task_id)
            except Timesheet.DoesNotExist:
                return Response({'detail': f'Task with id {task_id} not found in this report.'}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = TimesheetSerializer(task, data=task_data, context={'employee': report.employee, 'request': request}, partial=True)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()

        report.refresh_from_db()
        return Response(DailyReportSerializer(report).data)


class AdminTimesheetReviewView(AdminOnlyMixin, APIView):
    def post(self, request, pk):
        error = self.get_admin_error(request)
        if error:
            return error
        try:
            report = DailyReport.objects.prefetch_related(
                'tasks__project',
                'tasks__milestone',
            ).select_related('employee').get(pk=pk)
        except DailyReport.DoesNotExist:
            try:
                entry = Timesheet.objects.select_related('daily_report').get(pk=pk)
                report = DailyReport.objects.prefetch_related(
                    'tasks__project',
                    'tasks__milestone',
                ).select_related('employee').get(pk=entry.daily_report_id)
            except Timesheet.DoesNotExist:
                return Response({'detail': 'Daily report not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TimesheetReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        report.status = serializer.validated_data['status']
        report.review_comments = serializer.validated_data.get('review_comments', '')
        report.reviewed_at = timezone.now()
        if not report.submitted_at:
            report.submitted_at = timezone.now()
        report.save()
        return Response(DailyReportSerializer(report).data)


class TimesheetSettingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = TimesheetSetting.get_settings()
        serializer = TimesheetSettingSerializer(settings)
        return Response(serializer.data)


class AdminTimesheetSettingView(AdminOnlyMixin, APIView):
    def put(self, request):
        error = self.get_admin_error(request)
        if error:
            return error
        settings = TimesheetSetting.get_settings()
        serializer = TimesheetSettingSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
