# Generated manually

import django.db.models.deletion
from django.db import migrations, models


def link_projects_and_milestones(apps, schema_editor):
    Project = apps.get_model('timesheets', 'Project')
    Milestone = apps.get_model('timesheets', 'Milestone')
    DailyReport = apps.get_model('timesheets', 'DailyReport')
    Timesheet = apps.get_model('timesheets', 'Timesheet')

    for ts in Timesheet.objects.all():
        # 1. Resolve Project
        p_name = ts.project_name.strip()
        project, created = Project.objects.get_or_create(
            name__iexact=p_name,
            defaults={'name': p_name}
        )
        ts.project = project

        # 2. Resolve Milestone
        if ts.milestone_name:
            m_name = ts.milestone_name.strip()
            if m_name:
                milestone, created = Milestone.objects.get_or_create(
                    project=project,
                    name__iexact=m_name,
                    defaults={'name': m_name}
                )
                ts.milestone = milestone
            else:
                ts.milestone = None
        else:
            ts.milestone = None

        # 3. Resolve DailyReport
        if not ts.daily_report:
            report, created = DailyReport.objects.get_or_create(
                employee=ts.employee,
                date=ts.date,
                defaults={
                    'status': ts.status,
                    'review_comments': ts.review_comments,
                    'submitted_at': ts.submitted_at,
                    'reviewed_at': ts.reviewed_at,
                }
            )
            ts.daily_report = report
        else:
            report = ts.daily_report
            if report.status == 'draft' and ts.status != 'draft':
                report.status = ts.status
                report.review_comments = ts.review_comments or report.review_comments
                report.submitted_at = ts.submitted_at or report.submitted_at
                report.reviewed_at = ts.reviewed_at or report.reviewed_at
                report.save()

        ts.save()


class Migration(migrations.Migration):

    dependencies = [
        ('timesheets', '0006_dailyreport_timesheet_daily_report'),
    ]

    operations = [
        # Remove old indexes first to prevent FieldDoesNotExist exceptions during drop
        migrations.RemoveIndex(
            model_name='timesheet',
            name='timesheets__employe_662a75_idx',
        ),
        migrations.RemoveIndex(
            model_name='timesheet',
            name='timesheets__employe_292811_idx',
        ),
        migrations.RemoveIndex(
            model_name='timesheet',
            name='timesheets__status_b6eea6_idx',
        ),
        migrations.RemoveIndex(
            model_name='timesheet',
            name='timesheets__project_ad818f_idx',
        ),
        # Add nullable FKs
        migrations.AddField(
            model_name='timesheet',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='timesheets', to='timesheets.project'),
        ),
        migrations.AddField(
            model_name='timesheet',
            name='milestone',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='timesheets', to='timesheets.milestone'),
        ),
        # Run data migration to populate fields
        migrations.RunPython(link_projects_and_milestones, reverse_code=migrations.RunPython.noop),
        # Remove old columns
        migrations.RemoveField(
            model_name='timesheet',
            name='employee',
        ),
        migrations.RemoveField(
            model_name='timesheet',
            name='date',
        ),
        migrations.RemoveField(
            model_name='timesheet',
            name='project_name',
        ),
        migrations.RemoveField(
            model_name='timesheet',
            name='milestone_name',
        ),
        migrations.RemoveField(
            model_name='timesheet',
            name='status',
        ),
        migrations.RemoveField(
            model_name='timesheet',
            name='review_comments',
        ),
        migrations.RemoveField(
            model_name='timesheet',
            name='submitted_at',
        ),
        migrations.RemoveField(
            model_name='timesheet',
            name='reviewed_at',
        ),
        # Make the foreign keys non-nullable
        migrations.AlterField(
            model_name='timesheet',
            name='daily_report',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='timesheets.dailyreport'),
        ),
        migrations.AlterField(
            model_name='timesheet',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='timesheets', to='timesheets.project'),
        ),
        # Set ordering and indexes
        migrations.AlterModelOptions(
            name='timesheet',
            options={'ordering': ['-daily_report__date', 'actual_start']},
        ),
        migrations.AddIndex(
            model_name='timesheet',
            index=models.Index(fields=['daily_report'], name='timesheets__daily_r_ec1d55_idx'),
        ),
        migrations.AddIndex(
            model_name='timesheet',
            index=models.Index(fields=['project'], name='timesheets__project_63f736_idx'),
        ),
    ]
