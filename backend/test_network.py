import requests
import io
import json

# Login to get token
login_data = {'username': 'ADMIN', 'password': 'password123'}
resp = requests.post('http://127.0.0.1:8000/api/accounts/admin-login/', json=login_data)
print("LOGIN:", resp.status_code, resp.text)
if resp.status_code == 200:
    token = resp.json()['access']
    
    # Send multipart
    headers = {'Authorization': f'Bearer {token}'}
    files = {
        'profile_photo': ('test.png', b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82', 'image/png')
    }
    data = {
        'employee_id': 'TEST_NET_1',
        'full_name': 'Test User',
        'email': 'testnet1@example.com',
        'department': 'Engineering',
        'designation': 'Tester',
        'role': 'employee',
        'password': 'password123',
        'confirm_password': 'password123',
    }
    
    reg_resp = requests.post('http://127.0.0.1:8000/api/employees/register/', headers=headers, data=data, files=files)
    print("REGISTER:", reg_resp.status_code, reg_resp.text)
