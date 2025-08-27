#!/usr/bin/env python3
"""
Script to create sample data for testing TalentSphere
"""
import os
import sys
import json

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.main import app
from src.models.user import db
from src.models.job import JobCategory
from src.models.company import Company

def create_sample_data():
    """Create sample categories and companies"""
    with app.app_context():
        # Create job category
        category = JobCategory.query.filter_by(name='Software Development').first()
        if not category:
            category = JobCategory(
                name='Software Development',
                slug='software-development',
                description='Programming and software engineering roles'
            )
            db.session.add(category)
        
        # Create company
        company = Company.query.filter_by(name='TechCorp Solutions').first()
        if not company:
            company = Company(
                name='TechCorp Solutions',
                slug='techcorp-solutions',
                description='Leading technology solutions provider',
                industry='Technology',
                company_size='201-500',
                website='https://techcorp.com',
                city='San Francisco',
                state='CA',
                country='USA',
                is_verified=True
            )
            db.session.add(company)
        
        db.session.commit()
        
        print(f"✅ Sample data created successfully!")
        print(f"📂 Category ID: {category.id} - {category.name}")
        print(f"🏢 Company ID: {company.id} - {company.name}")
        
        return category, company

if __name__ == "__main__":
    try:
        category, company = create_sample_data()
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        sys.exit(1)
