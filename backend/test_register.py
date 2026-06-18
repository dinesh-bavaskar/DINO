import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.views import RegisterEmployeeView
from rest_framework_simplejwt.models import TokenUser

factory = APIRequestFactory()

token = {
    'employee_id': '101',
    'role': 'admin',
    'full_name': 'Dinesh Bavaskar',
    'user_id': 1
}
user = TokenUser(token)
user.is_superuser = False

data = {
    'employee_id': 'TEST999',
    'full_name': 'Test User',
    'email': 'test999@example.com',
    'department': 'Engineering',
    'designation': 'Tester',
    'role': 'employee',
    'password': 'password123'
}

request = factory.post('/api/employees/register/', data, format='json')
force_authenticate(request, user=user, token=token)

view = RegisterEmployeeView.as_view()
response = view(request)
try:
    response.render()
    print("REGISTER STATUS:", response.status_code)
    print("REGISTER DATA:", response.content.decode('utf-8'))
except Exception as e:
    import traceback
    traceback.print_exc()
