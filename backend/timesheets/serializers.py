from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from .models import DailyReport, Milestone, Project, Timesheet


DAILY_HOUR_LIMIT = Decimal('8.00')


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        return value.strip()


class MilestoneSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_id = serializers.IntegerField(source='project.id', read_only=True)

    class Meta:
        model = Milestone
        fields = ['id', 'project', 'project_id', 'project_name', 'name', 'is_active', 'created_at']
        read_only_fields = ['id', 'project_id', 'project_name', 'created_at']

    def validate_name(self, value):
        return value.strip()

    def validate(self, attrs):
        project = attrs.get('project')
        name = attrs.get('name', '').strip()
        instance = self.instance
        qs = Milestone.objects.filter(project=project, name__iexact=name)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError({'name': 'A milestone with this name already exists for the selected project.'})
        return attrs


def calculate_hours(start, end):
    start_dt = datetime.combine(timezone.localdate(), start)
    end_dt = datetime.combine(timezone.localdate(), end)
    if end_dt <= start_dt:
        raise serializers.ValidationError('End time must be after start time.')
    hours = Decimal(str((end_dt - start_dt).total_seconds() / 3600))
    return hours.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


class TimesheetSerializer(serializers.ModelSerializer):
    employee_id = serializers.CharField(source='daily_report.employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='daily_report.employee.full_name', read_only=True)
    employee_email = serializers.EmailField(source='daily_report.employee.email', read_only=True)
    date = serializers.DateField(source='daily_report.date', read_only=True)
    status = serializers.CharField(source='daily_report.status', read_only=True)
    review_comments = serializers.CharField(source='daily_report.review_comments', read_only=True)
    submitted_at = serializers.DateTimeField(source='daily_report.submitted_at', read_only=True)
    reviewed_at = serializers.DateTimeField(source='daily_report.reviewed_at', read_only=True)
    project_name = serializers.CharField()
    milestone_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Timesheet
        fields = [
            'id', 'employee_id', 'employee_name', 'employee_email', 'date',
            'project_name', 'milestone_name', 'task_name', 'task_type',
            'planned_start', 'planned_end', 'actual_start', 'actual_end',
            'planned_hours', 'actual_hours', 'remarks', 'status', 'review_comments',
            'submitted_at', 'reviewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'employee_id', 'employee_name', 'employee_email', 'date',
            'planned_hours', 'actual_hours', 'status', 'review_comments',
            'submitted_at', 'reviewed_at', 'created_at', 'updated_at'
        ]

    def validate(self, attrs):
        employee = self.context['employee']
        instance = self.instance

        if instance:
            entry_date = instance.daily_report.date
        else:
            entry_date = timezone.localdate()

        # Resolve project_name to Project instance
        project_name = attrs.pop('project_name', '').strip()
        if not project_name:
            raise serializers.ValidationError({'project_name': 'Project name is required.'})
        
        project, _ = Project.objects.get_or_create(
            name__iexact=project_name,
            defaults={'name': project_name, 'is_active': True}
        )
        attrs['project'] = project

        # Resolve milestone_name to Milestone instance
        milestone_name = attrs.pop('milestone_name', '').strip()
        if milestone_name:
            milestone, _ = Milestone.objects.get_or_create(
                project=project,
                name__iexact=milestone_name,
                defaults={'name': milestone_name, 'is_active': True}
            )
            attrs['milestone'] = milestone
        else:
            attrs['milestone'] = None

        planned_start = attrs.get('planned_start', instance.planned_start if instance else None)
        planned_end = attrs.get('planned_end', instance.planned_end if instance else None)
        actual_start = attrs.get('actual_start', instance.actual_start if instance else None)
        actual_end = attrs.get('actual_end', instance.actual_end if instance else None)

        planned_hours = calculate_hours(planned_start, planned_end)
        actual_hours = calculate_hours(actual_start, actual_end)

        # Retrieve/create DailyReport container
        daily_report, _ = DailyReport.objects.get_or_create(
            employee=employee,
            date=entry_date,
            defaults={'status': DailyReport.STATUS_DRAFT}
        )
        
        # Check overlapping slots
        entries = Timesheet.objects.filter(daily_report=daily_report)
        if instance:
            entries = entries.exclude(pk=instance.pk)

        if entries.filter(actual_start__lt=actual_end, actual_end__gt=actual_start).exists():
            raise serializers.ValidationError({
                'actual_start': 'Actual time overlaps with an existing work log.'
            })

        current_total = entries.aggregate(total=Sum('actual_hours'))['total'] or Decimal('0.00')
        if current_total + actual_hours > DAILY_HOUR_LIMIT:
            raise serializers.ValidationError({
                'actual_hours': 'Daily total actual hours must not exceed 8 hours.'
            })

        attrs['daily_report'] = daily_report
        attrs['planned_hours'] = planned_hours
        attrs['actual_hours'] = actual_hours
        return attrs

    def create(self, validated_data):
        return Timesheet.objects.create(**validated_data)


class TimesheetSubmitSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Timesheet.STATUS_DRAFT, Timesheet.STATUS_SUBMITTED])


class TimesheetReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Timesheet.STATUS_APPROVED, Timesheet.STATUS_REJECTED])
    review_comments = serializers.CharField(allow_blank=True, required=False)
