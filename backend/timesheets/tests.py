from decimal import Decimal
from datetime import time

from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Employee
from accounts.views import get_tokens_for_employee
from .models import DailyReport, Milestone, Project, Timesheet


class TimesheetApiTests(TestCase):
    def setUp(self):
        self.employee = Employee.objects.create(
            employee_id='EMP001',
            full_name='Test Employee',
            email='employee@example.com',
            department='Engineering',
            designation='Engineer',
            password=make_password('password123'),
            role='employee',
        )
        self.other = Employee.objects.create(
            employee_id='EMP002',
            full_name='Other Employee',
            email='other@example.com',
            department='Engineering',
            designation='Engineer',
            password=make_password('password123'),
            role='employee',
        )
        self.admin_employee = Employee.objects.create(
            employee_id='ADM001',
            full_name='Admin Employee',
            email='admin-employee@example.com',
            department='Management',
            designation='Manager',
            password=make_password('password123'),
            role='admin',
        )
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {get_tokens_for_employee(self.employee)['access']}")
        self.admin_client = APIClient()
        self.admin_client.credentials(HTTP_AUTHORIZATION=f"Bearer {get_tokens_for_employee(self.admin_employee)['access']}")

    def payload(self, **overrides):
        data = {
            'project_name': 'EMS',
            'milestone_name': 'Timesheets',
            'task_name': 'Daily Log',
            'task_type': 'Development',
            'planned_start': '09:00',
            'planned_end': '11:00',
            'actual_start': '09:00',
            'actual_end': '11:00',
            'remarks': 'Implemented work log flow.',
        }
        data.update(overrides)
        return data

    def test_create_today_entry_and_summary(self):
        response = self.client.post('/api/timesheets/', self.payload(), format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['planned_hours'], '2.00')
        self.assertEqual(response.data['actual_hours'], '2.00')

        summary = self.client.get('/api/dashboard-summary/')
        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.data['logged_hours'], 2.0)
        self.assertEqual(summary.data['remaining_hours'], 6.0)
        self.assertEqual(summary.data['total_tasks'], 1)

    def test_today_timesheet(self):
        self.client.post('/api/timesheets/', self.payload(task_name='JWT Login'), format='json')
        self.assertEqual(len(self.client.get('/api/timesheets/today/').data), 1)

    def test_update_and_delete_entry(self):
        created = self.client.post('/api/timesheets/', self.payload(), format='json')
        entry_id = created.data['id']
        updated = self.client.put(
            f'/api/timesheets/{entry_id}/',
            self.payload(actual_start='10:00', actual_end='12:30'),
            format='json'
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data['actual_hours'], '2.50')
        deleted = self.client.delete(f'/api/timesheets/{entry_id}/')
        self.assertEqual(deleted.status_code, 204)

    def test_daily_limit_and_overlap_validation(self):
        self.client.post('/api/timesheets/', self.payload(actual_start='09:00', actual_end='15:00'), format='json')
        overlap = self.client.post(
            '/api/timesheets/',
            self.payload(actual_start='14:00', actual_end='16:00'),
            format='json'
        )
        self.assertEqual(overlap.status_code, 400)
        self.assertIn('Time overlap detected. Please adjust task timings before saving.', str(overlap.data))

        planned_overlap = self.client.post(
            '/api/timesheets/',
            self.payload(planned_start='09:00', planned_end='11:00'),
            format='json'
        )
        self.assertEqual(planned_overlap.status_code, 400)
        self.assertIn('Time overlap detected. Please adjust task timings before saving.', str(planned_overlap.data))

        over_limit = self.client.post(
            '/api/timesheets/',
            self.payload(actual_start='15:00', actual_end='18:00'),
            format='json'
        )
        self.assertEqual(over_limit.status_code, 400)

    def test_unauthorized_and_ownership(self):
        anon = APIClient()
        self.assertEqual(anon.get('/api/timesheets/today/').status_code, 401)

        other_project = Project.objects.create(name='Other', is_active=True)
        other_milestone = Milestone.objects.create(project=other_project, name='Private', is_active=True)
        other_report = DailyReport.objects.create(
            employee=self.other,
            date=timezone.localdate(),
            status=DailyReport.STATUS_DRAFT
        )
        other_entry = Timesheet.objects.create(
            daily_report=other_report,
            project=other_project,
            milestone=other_milestone,
            task_name='Hidden',
            task_type='Testing',
            planned_start=time(9, 0),
            planned_end=time(10, 0),
            actual_start=time(9, 0),
            actual_end=time(10, 0),
            planned_hours=Decimal('1.00'),
            actual_hours=Decimal('1.00'),
            remarks='Private',
        )
        self.assertEqual(self.client.delete(f'/api/timesheets/{other_entry.id}/').status_code, 404)

    def test_employee_submit_and_admin_can_filter_and_view(self):
        created = self.client.post('/api/timesheets/', self.payload(project_name='Workflow'), format='json')
        self.assertEqual(created.data['status'], Timesheet.STATUS_DRAFT)

        submitted = self.client.post(
            f"/api/timesheets/{created.data['id']}/submit/",
            {'status': Timesheet.STATUS_SUBMITTED},
            format='json'
        )
        self.assertEqual(submitted.status_code, 200)
        self.assertEqual(submitted.data['status'], Timesheet.STATUS_SUBMITTED)
        self.assertEqual(submitted.data['employee_id'], self.employee.employee_id)

        admin_list = self.admin_client.get('/api/admin/timesheets/?employee=Test&project=Workflow&status=submitted')
        self.assertEqual(admin_list.status_code, 200)
        self.assertEqual(admin_list.data['count'], 1)
        self.assertEqual(len(admin_list.data['results']), 1)

        detail = self.admin_client.get(f"/api/admin/timesheets/{created.data['id']}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data['tasks'][0]['task_name'], 'Daily Log')

    def test_admin_approve_and_reject_workflow(self):
        created = self.client.post('/api/timesheets/', self.payload(), format='json')
        self.client.post(f"/api/timesheets/{created.data['id']}/submit/", {'status': 'submitted'}, format='json')

        approved = self.admin_client.post(
            f"/api/admin/timesheets/{created.data['id']}/review/",
            {'status': 'approved', 'review_comments': 'Looks good.'},
            format='json'
        )
        self.assertEqual(approved.status_code, 200)
        self.assertEqual(approved.data['status'], 'approved')
        self.assertEqual(approved.data['review_comments'], 'Looks good.')

        rejected = self.admin_client.post(
            f"/api/admin/timesheets/{created.data['id']}/review/",
            {'status': 'rejected', 'review_comments': 'Please clarify remarks.'},
            format='json'
        )
        self.assertEqual(rejected.status_code, 200)
        self.assertEqual(rejected.data['status'], 'rejected')

    def test_employee_cannot_access_admin_submissions(self):
        response = self.client.get('/api/admin/timesheets/')
        self.assertEqual(response.status_code, 403)

    def test_admin_can_activate_and_deactivate_employee(self):
        deactivate = self.admin_client.patch(
            f'/api/employees/{self.employee.id}/status/',
            {'is_active': False},
            format='json'
        )
        self.assertEqual(deactivate.status_code, 200)
        self.assertFalse(deactivate.data['is_active'])

        activate = self.admin_client.patch(
            f'/api/employees/{self.employee.id}/status/',
            {'is_active': True},
            format='json'
        )
        self.assertEqual(activate.status_code, 200)
        self.assertTrue(activate.data['is_active'])

    def test_admin_can_manage_projects_and_employee_can_read_active_projects(self):
        created = self.admin_client.post('/api/admin/projects/', {'name': 'Payroll Portal'}, format='json')
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data['name'], 'Payroll Portal')

        deactivate = self.admin_client.patch(
            f"/api/admin/projects/{created.data['id']}/",
            {'is_active': False},
            format='json'
        )
        self.assertEqual(deactivate.status_code, 200)
        self.assertFalse(deactivate.data['is_active'])

        employee_list = self.client.get('/api/projects/')
        self.assertEqual(employee_list.status_code, 200)
        self.assertEqual(employee_list.data, [])

        activate = self.admin_client.patch(
            f"/api/admin/projects/{created.data['id']}/",
            {'is_active': True},
            format='json'
        )
        self.assertEqual(activate.status_code, 200)
        self.assertTrue(activate.data['is_active'])

        inactive = Project.objects.create(name='Archived Project', is_active=False)
        employee_list = self.client.get('/api/projects/')
        self.assertEqual(employee_list.status_code, 200)
        self.assertEqual([project['name'] for project in employee_list.data], ['Payroll Portal'])

        deleted = self.admin_client.delete(f'/api/admin/projects/{inactive.id}/')
        self.assertEqual(deleted.status_code, 204)

    def test_admin_can_manage_milestones(self):
        project = Project.objects.create(name='Milestone Project', is_active=True)
        # Create milestone
        created = self.admin_client.post('/api/admin/milestones/', {'project': project.id, 'name': 'Phase 1'}, format='json')
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data['name'], 'Phase 1')
        self.assertTrue(created.data['is_active'])

        # Patch milestone status & name
        updated = self.admin_client.patch(
            f"/api/admin/milestones/{created.data['id']}/",
            {'name': 'Phase 1 - Kickoff', 'is_active': False},
            format='json'
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data['name'], 'Phase 1 - Kickoff')
        self.assertFalse(updated.data['is_active'])

        # Check in DB
        milestone = Milestone.objects.get(id=created.data['id'])
        self.assertEqual(milestone.name, 'Phase 1 - Kickoff')
        self.assertFalse(milestone.is_active)

        # Delete milestone
        deleted = self.admin_client.delete(f"/api/admin/milestones/{created.data['id']}/")
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(Milestone.objects.filter(id=created.data['id']).exists())
