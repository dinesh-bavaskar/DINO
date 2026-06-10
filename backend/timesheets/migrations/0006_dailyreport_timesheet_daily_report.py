# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_employee_accounts_em_role_9455c0_idx_and_more'),
        ('timesheets', '0005_milestone'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('submitted', 'Submitted'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='draft', max_length=12)),
                ('review_comments', models.TextField(blank=True)),
                ('submitted_at', models.DateTimeField(blank=True, null=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('employee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='daily_reports', to='accounts.employee')),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
        migrations.AddField(
            model_name='timesheet',
            name='daily_report',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='timesheets.dailyreport'),
        ),
        migrations.AddIndex(
            model_name='dailyreport',
            index=models.Index(fields=['employee', 'date'], name='timesheets__employe_8c41ca_idx'),
        ),
        migrations.AddIndex(
            model_name='dailyreport',
            index=models.Index(fields=['status', 'date'], name='timesheets__status_a42d8d_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='dailyreport',
            unique_together={('employee', 'date')},
        ),
    ]
