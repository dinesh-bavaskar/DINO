from decimal import Decimal

from django.db import models

from accounts.models import Employee


class Project(models.Model):
    name = models.CharField(max_length=120, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active', 'name']),
        ]

    def __str__(self):
        return self.name


class Milestone(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['project__name', 'name']
        unique_together = ('project', 'name')
        indexes = [
            models.Index(fields=['project', 'is_active']),
        ]

    def __str__(self):
        return f'{self.project.name} → {self.name}'


class DailyReport(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_SUBMITTED = 'submitted'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = (
        (STATUS_DRAFT, 'Draft'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='daily_reports')
    date = models.DateField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    review_comments = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        unique_together = ('employee', 'date')
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['status', 'date']),
        ]

    def __str__(self):
        return f'{self.employee.employee_id} - {self.date} - {self.status}'


class Timesheet(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_SUBMITTED = 'submitted'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = (
        (STATUS_DRAFT, 'Draft'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    )

    TASK_TYPE_CHOICES = (
        ('Development', 'Development'),
        ('Bug Fix', 'Bug Fix'),
        ('Testing', 'Testing'),
        ('Research', 'Research'),
        ('Documentation', 'Documentation'),
        ('Meeting', 'Meeting'),
        ('Support', 'Support'),
        ('Code Review', 'Code Review'),
    )

    daily_report = models.ForeignKey(DailyReport, on_delete=models.CASCADE, related_name='tasks')
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name='timesheets')
    milestone = models.ForeignKey(Milestone, on_delete=models.PROTECT, related_name='timesheets', null=True, blank=True)
    task_name = models.CharField(max_length=160)
    task_type = models.CharField(max_length=30, choices=TASK_TYPE_CHOICES)
    planned_start = models.TimeField(null=True, blank=True)
    planned_end = models.TimeField(null=True, blank=True)
    actual_start = models.TimeField(null=True, blank=True)
    actual_end = models.TimeField(null=True, blank=True)
    planned_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0.00'))
    actual_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0.00'))
    remarks = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-daily_report__date', 'actual_start']
        indexes = [
            models.Index(fields=['daily_report']),
            models.Index(fields=['project']),
        ]

    @property
    def project_name(self):
        return self.project.name if self.project else ''

    @property
    def milestone_name(self):
        return self.milestone.name if self.milestone else ''

    def __str__(self):
        return f'{self.daily_report.employee.employee_id} - {self.daily_report.date} - {self.task_name}'


class TimesheetSetting(models.Model):
    planned_start_time = models.TimeField(default="06:00:00")
    planned_end_time = models.TimeField(default="12:00:00")
    actual_start_time = models.TimeField(default="12:00:00")
    actual_end_time = models.TimeField(default="23:59:00")

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                'planned_start_time': '06:00:00',
                'planned_end_time': '12:00:00',
                'actual_start_time': '12:00:00',
                'actual_end_time': '23:59:00',
            }
        )
        return obj

    def __str__(self):
        return f"Planned: {self.planned_start_time}-{self.planned_end_time}, Actual: {self.actual_start_time}-{self.actual_end_time}"
