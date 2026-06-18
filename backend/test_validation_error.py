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

# Create an employee ID 1 if it doesn't exist
if not Employee.objects.filter(employee_id='1').exists():
    Employee.objects.create(employee_id='1', full_name='Test', email='test1@test.com', role='employee')

# Valid 1x1 PNG image
png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
file_obj = io.BytesIO(png_data)
file_obj.name = 'test.png'

data = {
    'employee_id': '1', # This should trigger a validation error
    'full_name': 'Dinesh Bavaskar',
    'email': 'bavaskardinesh35@gmail.com',
    'department': 'Engineering',
    'designation': 'Developerr',
    'role': 'employee',
    'password': 'password123',
    'confirm_password': 'password123',
    'profile_photo': file_obj
}

response = client.post('/api/employees/register/', data, format='multipart')

print("STATUS:", response.status_code)
print("RESPONSE:", response.content.decode()[:500])
