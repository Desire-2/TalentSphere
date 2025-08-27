#!/usr/bin/env python3

import sqlite3
from werkzeug.security import check_password_hash

# Connect to database
conn = sqlite3.connect('src/database/app.db')
cursor = conn.cursor()

# Get employer accounts
cursor.execute("SELECT id, email, password_hash FROM users WHERE role='employer'")
employers = cursor.fetchall()

print("Employer accounts:")
for emp_id, email, password_hash in employers:
    print(f"ID: {emp_id}, Email: {email}")
    
    # Test common passwords
    test_passwords = ['password123', 'testpass123', 'admin123', 'employer123']
    for pwd in test_passwords:
        if check_password_hash(password_hash, pwd):
            print(f"  Password: {pwd} ✓")
            break
    else:
        print(f"  Password: Unknown")

conn.close()
