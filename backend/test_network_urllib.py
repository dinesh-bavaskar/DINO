import urllib.request
import urllib.parse
import json
import uuid

# Login
login_data = json.dumps({'username': 'ADMIN', 'password': 'password123'}).encode()
req = urllib.request.Request('http://localhost:8000/api/accounts/admin-login/', data=login_data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        resp_data = json.loads(response.read())
        token = resp_data['access']
        print("LOGIN SUCCESS")
except Exception as e:
    print("LOGIN FAILED:", e)
    exit(1)
