#!/usr/bin/env python3
"""
Script to check work experience descriptions in database
to identify any truncation issues
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from main import app, db
from models.profile_extensions import WorkExperience

def check_descriptions():
    with app.app_context():
        experiences = WorkExperience.query.all()
        
        print(f"\n=== Checking {len(experiences)} Work Experiences ===\n")
        
        for exp in experiences:
            desc = exp.description or ""
            desc_len = len(desc)
            
            # Check if description seems truncated (ends mid-word or mid-sentence)
            is_truncated = desc_len > 0 and not desc.endswith(('.', '!', '?', '"', "'"))
            
            print(f"ID: {exp.id} | User: {exp.user_id} | Company: {exp.company_name}")
            print(f"Title: {exp.job_title}")
            print(f"Description length: {desc_len} characters")
            
            if is_truncated:
                print(f"⚠️  WARNING: Description appears truncated!")
                print(f"Last 100 chars: ...{desc[-100:]}")
            elif desc_len == 0:
                print(f"ℹ️  No description")
            else:
                print(f"✓ Description complete")
                if desc_len > 100:
                    print(f"Preview: {desc[:100]}...")
            
            print("-" * 80)

if __name__ == '__main__':
    check_descriptions()
