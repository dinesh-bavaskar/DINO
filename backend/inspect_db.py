import os
import sys
import django

# Add backend directory to sys.path
sys.path.append(r"c:\Users\DINO\Desktop\DINO - Copy\backend")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT app, name, applied FROM django_migrations WHERE app = 'timesheets' ORDER BY id")
    rows = cursor.fetchall()
    print("Migrations for timesheets:")
    for row in rows:
        print(f"  {row[0]} - {row[1]} applied at {row[2]}")
