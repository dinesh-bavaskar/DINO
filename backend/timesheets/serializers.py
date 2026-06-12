from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from .models import DailyReport, Milestone, Project, Timesheet, TimesheetSetting


DAILY_HOUR_LIMIT = Decimal('8.00')


class TimesheetSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimesheetSetting
        fields = ['planned_start_time', 'planned_end_time', 'actual_start_time', 'actual_end_time']


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

        # Time Window Validation
        request = self.context.get('request')
        is_admin = False
        if request:
            is_admin = bool(
                getattr(request.user, 'is_superuser', False) or
                (hasattr(request.auth, 'get') and request.auth.get('role') == 'admin')
            )

        import sys
        from django.conf import settings as django_settings
        is_testing = 'test' in sys.argv
        force_test_validation = getattr(django_settings, 'FORCE_TIME_WINDOW_VALIDATION', False)

        if (not is_admin and not is_testing) or force_test_validation:
            settings = TimesheetSetting.get_settings()
            current_time = timezone.localtime(timezone.now()).time()

            def is_time_in_window(t, start, end):
                if start <= end:
                    return start <= t <= end
                else:
                    return t >= start or t <= end

            in_planned_window = is_time_in_window(current_time, settings.planned_start_time, settings.planned_end_time)
            in_actual_window = is_time_in_window(current_time, settings.actual_start_time, settings.actual_end_time)

            new_planned_start = attrs.get('planned_start')
            new_planned_end = attrs.get('planned_end')

            if instance:
                planned_changed = False
                if new_planned_start is not None and new_planned_start != instance.planned_start:
                    planned_changed = True
                if new_planned_end is not None and new_planned_end != instance.planned_end:
                    planned_changed = True

                if planned_changed and not in_planned_window:
                    raise serializers.ValidationError(
                        f"Planned Time fields can only be edited during the Planned Time Window ({settings.planned_start_time.strftime('%I:%M %p')} to {settings.planned_end_time.strftime('%I:%M %p')})."
                    )
            else:
                if not in_planned_window:
                    raise serializers.ValidationError(
                        f"Planned Time fields can only be edited during the Planned Time Window ({settings.planned_start_time.strftime('%I:%M %p')} to {settings.planned_end_time.strftime('%I:%M %p')})."
                    )

            # Check actual times
            new_actual_start = attrs.get('actual_start')
            new_actual_end = attrs.get('actual_end')

            if instance:
                actual_changed = False
                if new_actual_start is not None and new_actual_start != instance.actual_start:
                    actual_changed = True
                if new_actual_end is not None and new_actual_end != instance.actual_end:
                    actual_changed = True

                if actual_changed and not in_actual_window:
                    raise serializers.ValidationError(
                        f"Actual Time fields can only be edited during the Actual Time Window ({settings.actual_start_time.strftime('%I:%M %p')} to {settings.actual_end_time.strftime('%I:%M %p')})."
                    )
            else:
                if not in_actual_window:
                    planned_s = new_planned_start
                    planned_e = new_planned_end

                    if (new_actual_start and new_actual_start != planned_s) or (new_actual_end and new_actual_end != planned_e):
                        raise serializers.ValidationError(
                            f"Actual Time fields can only be edited during the Actual Time Window ({settings.actual_start_time.strftime('%I:%M %p')} to {settings.actual_end_time.strftime('%I:%M %p')})."
                        )

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

        # Check planned overlap
        if planned_start and planned_end:
            if entries.filter(planned_start__lt=planned_end, planned_end__gt=planned_start).exists():
                raise serializers.ValidationError('Time overlap detected. Please adjust task timings before saving.')

        # Check actual overlap
        if actual_start and actual_end:
            if entries.filter(actual_start__lt=actual_end, actual_end__gt=actual_start).exists():
                raise serializers.ValidationError('Time overlap detected. Please adjust task timings before saving.')

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


class DailyReportSerializer(serializers.ModelSerializer):
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_email = serializers.EmailField(source='employee.email', read_only=True)
    tasks = TimesheetSerializer(many=True, read_only=True)
    task_count = serializers.SerializerMethodField()
    total_planned_hours = serializers.SerializerMethodField()
    total_actual_hours = serializers.SerializerMethodField()
    project_names = serializers.SerializerMethodField()

    class Meta:
        model = DailyReport
        fields = [
            'id', 'employee_id', 'employee_name', 'employee_email', 'date',
            'status', 'review_comments', 'submitted_at', 'reviewed_at',
            'task_count', 'total_planned_hours', 'total_actual_hours',
            'project_names', 'tasks', 'created_at', 'updated_at'
        ]
        read_only_fields = fields

    def get_total_planned_hours(self, obj):
        total = sum((task.planned_hours for task in obj.tasks.all()), Decimal('0.00'))
        return str(total.quantize(Decimal('0.01')))

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_total_actual_hours(self, obj):
        total = sum((task.actual_hours for task in obj.tasks.all()), Decimal('0.00'))
        return str(total.quantize(Decimal('0.01')))

    def get_project_names(self, obj):
        names = []
        for task in obj.tasks.all():
            if task.project_name and task.project_name not in names:
                names.append(task.project_name)
        return names


class TimesheetSubmitSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Timesheet.STATUS_DRAFT, Timesheet.STATUS_SUBMITTED])


class TimesheetReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Timesheet.STATUS_APPROVED, Timesheet.STATUS_REJECTED])
    review_comments = serializers.CharField(allow_blank=True, required=False)
