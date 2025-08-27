#!/usr/bin/env python3
import sys
import os

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from src.main import app
from src.models.user import db
from src.models.company import Company
from src.models.user import User
from werkzeug.security import generate_password_hash

def create_sample_companies():
    with app.app_context():
        # Check companies
        companies = Company.query.all()
        print(f'Total companies: {len(companies)}')
        
        # Check users  
        users = User.query.all()
        print(f'Total users: {len(users)}')
        
        # If no companies, create some
        if len(companies) == 0:
            print('Creating sample companies...')
            
            # Find or create an employer user
            employer = User.query.filter_by(role='employer').first()
            if not employer:
                employer = User(
                    email='employer@test.com',
                    password_hash=generate_password_hash('password123'),
                    role='employer',
                    first_name='Test',
                    last_name='Employer',
                    is_active=True,
                    is_verified=True
                )
                db.session.add(employer)
                db.session.commit()
            
            # Create companies
            companies_data = [
                Company(
                    name='TechCorp Solutions',
                    slug='techcorp-solutions',
                    description='Leading technology solutions provider specializing in cloud computing and enterprise software',
                    industry='Technology',
                    city='San Francisco',
                    state='CA',
                    country='USA',
                    website='https://techcorp.com',
                    email='contact@techcorp.com',
                    company_size='201-500',
                    is_verified=True,
                    is_featured=True
                ),
                Company(
                    name='StartupInc',
                    slug='startupinc',
                    description='Innovative startup focused on AI solutions and machine learning platforms',
                    industry='AI',
                    city='New York',
                    state='NY',
                    country='USA',
                    website='https://startupinc.com',
                    email='hello@startupinc.com',
                    company_size='1-10',
                    is_verified=False,
                    is_featured=False
                ),
                Company(
                    name='Enterprise Global',
                    slug='enterprise-global',
                    description='Fortune 500 company with worldwide operations in financial services',
                    industry='Finance',
                    city='London',
                    country='UK',
                    website='https://enterprise.com',
                    email='hr@enterprise.com',
                    company_size='500+',
                    is_verified=True,
                    is_featured=False
                ),
                Company(
                    name='GreenTech Innovations',
                    slug='greentech-innovations',
                    description='Sustainable technology company focused on renewable energy solutions',
                    industry='Clean Energy',
                    city='Austin',
                    state='TX',
                    country='USA',
                    website='https://greentech.com',
                    email='info@greentech.com',
                    company_size='51-200',
                    is_verified=False,
                    is_featured=True
                ),
                Company(
                    name='Digital Marketing Pro',
                    slug='digital-marketing-pro',
                    description='Full-service digital marketing agency helping businesses grow online',
                    industry='Marketing',
                    city='Los Angeles',
                    state='CA',
                    country='USA',
                    website='https://digitalmarketingpro.com',
                    email='contact@digitalmarketingpro.com',
                    company_size='11-50',
                    is_verified=True,
                    is_featured=False
                )
            ]
            
            for company in companies_data:
                db.session.add(company)
            
            db.session.commit()
            print(f'✅ Created {len(companies_data)} sample companies')
        else:
            print('Companies already exist:')
            for company in companies:
                print(f'  - {company.name} (verified: {company.is_verified}, featured: {company.is_featured})')

if __name__ == '__main__':
    create_sample_companies()
