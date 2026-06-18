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

data = '------WebKitFormBoundary\r\nContent-Disposition: form-data; name="email"\r\n\r\ntest@example.com\r\n------WebKitFormBoundary--\r\n'

response = client.post('/api/employees/register/', data, content_type='application/json')

print("STATUS:", response.status_code)
print("RESPONSE:", response.content.decode())
