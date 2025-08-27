#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User, EmployerProfile
from src.models.job import JobCategory
from src.models.company import Company
from src.main import app

def create_sample_job_categories():
    """Create sample job categories for testing"""
    
    categories = [
        {
            'name': 'Software Development',
            'slug': 'software-development',
            'description': 'Jobs in software engineering, programming, and development',
            'icon': 'code',
            'color': '#3B82F6'
        },
        {
            'name': 'Data Science & Analytics',
            'slug': 'data-science-analytics',
            'description': 'Data analysis, machine learning, and AI positions',
            'icon': 'database',
            'color': '#10B981'
        },
        {
            'name': 'Product Management',
            'slug': 'product-management',
            'description': 'Product strategy, roadmapping, and management roles',
            'icon': 'trending-up',
            'color': '#F59E0B'
        },
        {
            'name': 'Design & UX',
            'slug': 'design-ux',
            'description': 'UI/UX design, graphic design, and creative positions',
            'icon': 'palette',
            'color': '#EF4444'
        },
        {
            'name': 'Marketing & Sales',
            'slug': 'marketing-sales',
            'description': 'Digital marketing, sales, and business development',
            'icon': 'megaphone',
            'color': '#8B5CF6'
        },
        {
            'name': 'Customer Success',
            'slug': 'customer-success',
            'description': 'Customer support, success, and relationship management',
            'icon': 'users',
            'color': '#06B6D4'
        },
        {
            'name': 'Operations & Finance',
            'slug': 'operations-finance',
            'description': 'Business operations, finance, and administrative roles',
            'icon': 'calculator',
            'color': '#84CC16'
        },
        {
            'name': 'Human Resources',
            'slug': 'human-resources',
            'description': 'HR, recruiting, talent acquisition, and people operations',
            'icon': 'user-check',
            'color': '#F97316'
        }
    ]
    
    created_count = 0
    
    for cat_data in categories:
        # Check if category already exists
        existing = JobCategory.query.filter_by(slug=cat_data['slug']).first()
        if not existing:
            category = JobCategory(
                name=cat_data['name'],
                slug=cat_data['slug'],
                description=cat_data['description'],
                icon=cat_data['icon'],
                color=cat_data['color'],
                is_active=True,
                display_order=created_count
            )
            db.session.add(category)
            created_count += 1
            print(f"✅ Created category: {cat_data['name']}")
        else:
            print(f"⏭️  Category already exists: {cat_data['name']}")
    
    db.session.commit()
    return created_count

def create_test_employer():
    """Create a test employer user with company"""
    
    # Check if test employer already exists
    existing_user = User.query.filter_by(email='employer@test.com').first()
    if existing_user:
        print("⏭️  Test employer already exists")
        return existing_user
    
    # Create test employer user
    user = User(
        email='employer@test.com',
        first_name='John',
        last_name='Employer',
        role='employer',
        phone='+1-555-0123',
        location='San Francisco, CA',
        is_active=True,
        is_verified=True
    )
    user.set_password('TestPassword123!')
    
    db.session.add(user)
    db.session.flush()  # Get user ID
    
    # Create a test company
    company = Company(
        name='TechCorp Inc',
        slug='techcorp-inc',
        description='A leading technology company specializing in innovative software solutions.',
        tagline='Building the future, one line of code at a time',
        website='https://techcorp.com',
        email='contact@techcorp.com',
        phone='+1-555-TECH',
        city='San Francisco',
        state='California',
        country='United States',
        industry='Technology',
        company_size='51-200',
        founded_year=2015,
        company_type='corporation',
        is_active=True,
        is_verified=True
    )
    
    db.session.add(company)
    db.session.flush()  # Get company ID
    
    # Create employer profile
    employer_profile = EmployerProfile(
        user_id=user.id,
        company_id=company.id,
        job_title='Engineering Manager',
        department='Engineering',
        hiring_authority=True,
        work_email='john@techcorp.com',
        is_verified_employer=True
    )
    
    db.session.add(employer_profile)
    db.session.commit()
    
    print(f"✅ Created test employer: {user.email}")
    print(f"✅ Created test company: {company.name}")
    print(f"   Login credentials: employer@test.com / TestPassword123!")
    
    return user

def main():
    print("🚀 Setting up TalentSphere sample data...")
    print("=" * 50)
    
    with app.app_context():
        # Create job categories
        print("📂 Creating job categories...")
        categories_created = create_sample_job_categories()
        print(f"✅ Created {categories_created} new job categories")
        print()
        
        # Create test employer
        print("👤 Creating test employer...")
        test_employer = create_test_employer()
        print()
        
        print("🎉 Sample data setup complete!")
        print("=" * 50)
        print("You can now:")
        print("1. Login as employer@test.com / TestPassword123!")
        print("2. Navigate to http://localhost:5174/employer/jobs/create")
        print("3. Post test jobs with the sample categories")
        print()
        print("Backend running on: http://localhost:5001")
        print("Frontend running on: http://localhost:5174")

if __name__ == '__main__':
    main()
