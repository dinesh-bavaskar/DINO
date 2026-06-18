import os
import django
import io

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import Employee

admin_emp = Employee.objects.filter(role='admin').first()
token = AccessToken.for_user(admin_emp)

client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

# Create a 4MB file
file_obj = io.BytesIO(b'a' * 4 * 1024 * 1024)
file_obj.name = 'large.png'

data = {
    'employee_id': 'TEST4MB',
    'full_name': 'Test User',
    'email': 'test4mb@example.com',
    'department': 'Engineering',
    'designation': 'Tester',
    'role': 'employee',
    'password': 'password123',
    'confirm_password': 'password123',
    'profile_photo': file_obj
}

response = client.post('/api/employees/register/', data, format='multipart')

print("STATUS:", response.status_code)
print("RESPONSE:", response.content.decode()[:500])
