#!/usr/bin/env python3

import requests
import json

# Test the job update API endpoint
url = "http://localhost:5001/api/jobs/17"

# Test with minimal data first
test_data = {
    "title": "Test Updated Title",
    "description": "This is a test description that should be long enough to pass validation",
    "external_company_name": "Test Company Updated"
}

headers = {
    "Content-Type": "application/json"
}

print("Testing job update without authentication...")
response = requests.put(url, json=test_data, headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code != 200:
    print(f"Error: {response.status_code}")
    try:
        error_data = response.json()
        print(f"Error details: {error_data}")
    except:
        print("Could not parse error response as JSON")
