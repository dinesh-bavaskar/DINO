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

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='timesheets')
    date = models.DateField()
    project_name = models.CharField(max_length=120)
    milestone_name = models.CharField(max_length=120)
    task_name = models.CharField(max_length=160)
    task_type = models.CharField(max_length=30, choices=TASK_TYPE_CHOICES)
    planned_start = models.TimeField()
    planned_end = models.TimeField()
    actual_start = models.TimeField()
    actual_end = models.TimeField()
    planned_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0.00'))
    actual_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0.00'))
    remarks = models.TextField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    review_comments = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'actual_start']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['employee', 'status', 'date']),
            models.Index(fields=['status', 'date']),
            models.Index(fields=['project_name']),
        ]

    def __str__(self):
        return f'{self.employee.employee_id} - {self.date} - {self.task_name}'
