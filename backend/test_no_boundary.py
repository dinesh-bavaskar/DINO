import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import Employee

admin_emp = Employee.objects.filter(role='admin').first()
token = AccessToken.for_user(admin_emp)

client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

response = client.post('/api/employees/register/', data='some junk data', content_type='multipart/form-data')

print("STATUS:", response.status_code)
print("RESPONSE:", response.content.decode())
