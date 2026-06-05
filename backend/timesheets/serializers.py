from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from .models import Project, Timesheet


DAILY_HOUR_LIMIT = Decimal('8.00')


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        return value.strip()


def calculate_hours(start, end):
    start_dt = datetime.combine(timezone.localdate(), start)
    end_dt = datetime.combine(timezone.localdate(), end)
    if end_dt <= start_dt:
        raise serializers.ValidationError('End time must be after start time.')
    hours = Decimal(str((end_dt - start_dt).total_seconds() / 3600))
    return hours.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


class TimesheetSerializer(serializers.ModelSerializer):
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_email = serializers.EmailField(source='employee.email', read_only=True)

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
        entry_date = timezone.localdate()
        instance = self.instance

        planned_start = attrs.get('planned_start', instance.planned_start if instance else None)
        planned_end = attrs.get('planned_end', instance.planned_end if instance else None)
        actual_start = attrs.get('actual_start', instance.actual_start if instance else None)
        actual_end = attrs.get('actual_end', instance.actual_end if instance else None)

        planned_hours = calculate_hours(planned_start, planned_end)
        actual_hours = calculate_hours(actual_start, actual_end)

        entries = Timesheet.objects.filter(employee=employee, date=entry_date)
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

        attrs['date'] = entry_date
        attrs['planned_hours'] = planned_hours
        attrs['actual_hours'] = actual_hours
        return attrs

    def create(self, validated_data):
        validated_data['employee'] = self.context['employee']
        return super().create(validated_data)


class TimesheetSubmitSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Timesheet.STATUS_DRAFT, Timesheet.STATUS_SUBMITTED])


class TimesheetReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Timesheet.STATUS_APPROVED, Timesheet.STATUS_REJECTED])
    review_comments = serializers.CharField(allow_blank=True, required=False)
