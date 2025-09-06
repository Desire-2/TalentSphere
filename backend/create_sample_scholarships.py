#!/usr/bin/env python3
"""
Create Sample External Scholarships
This script creates sample scholarship data for testing the scholarship system.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.user import db, User
from src.models.scholarship import Scholarship, ScholarshipCategory
from datetime import datetime, timedelta
import random

def create_sample_external_scholarships():
    """Create sample external scholarships"""
    try:
        print("🎓 Creating Sample External Scholarships")
        print("=" * 50)
        
        # Import the app to get the database context
        import src.main as main_module
        app = main_module.app
        
        with app.app_context():
            # Get an external admin user
            external_admin = User.query.filter_by(role='external_admin').first()
            if not external_admin:
                print("❌ No external admin user found. Please create one first using:")
                print("python create_external_admin.py")
                return False
            
            # Get scholarship categories
            categories = ScholarshipCategory.query.all()
            if not categories:
                print("❌ No scholarship categories found. Please run migration first.")
                return False
            
            print(f"👤 Using external admin: {external_admin.email}")
            print(f"📚 Available categories: {len(categories)}")
            
            # Sample scholarship data
            sample_scholarships = [
                {
                    'title': 'Gates Millennium Scholarship',
                    'external_organization_name': 'Bill & Melinda Gates Foundation',
                    'external_organization_website': 'https://www.gatesfoundation.org',
                    'external_organization_logo': 'https://www.gatesfoundation.org/logo.png',
                    'description': 'The Gates Millennium Scholars Program provides outstanding African American, American Indian/Alaska Native, Asian Pacific Islander American, and Hispanic American students with an opportunity to complete an undergraduate college education in any discipline area of interest.',
                    'summary': 'Full scholarship for minority students covering undergraduate education',
                    'scholarship_type': 'need-based',
                    'study_level': 'undergraduate',
                    'field_of_study': 'Any field',
                    'location_type': 'specific-country',
                    'country': 'United States',
                    'amount_min': 20000,
                    'amount_max': 80000,
                    'currency': 'USD',
                    'funding_type': 'full',
                    'renewable': True,
                    'duration_years': 4,
                    'min_gpa': 3.3,
                    'max_age': 25,
                    'nationality_requirements': '["US Citizen", "Permanent Resident"]',
                    'gender_requirements': 'any',
                    'other_requirements': 'Must demonstrate leadership abilities and academic excellence',
                    'application_deadline': datetime.utcnow() + timedelta(days=120),
                    'application_type': 'external',
                    'application_url': 'https://www.gatesfoundation.org/apply',
                    'application_instructions': 'Complete online application with essays, transcripts, and recommendations',
                    'required_documents': '["Transcripts", "SAT/ACT Scores", "Financial Aid Forms"]',
                    'requires_transcript': True,
                    'requires_recommendation_letters': True,
                    'num_recommendation_letters': 3,
                    'requires_essay': True,
                    'essay_topics': '["Leadership Experience", "Community Service", "Academic Goals"]',
                    'requires_portfolio': False,
                    'status': 'published',
                    'source_url': 'https://www.gatesfoundation.org/scholarships'
                },
                {
                    'title': 'Fulbright Foreign Student Program',
                    'external_organization_name': 'U.S. Department of State',
                    'external_organization_website': 'https://foreign.fulbrightonline.org',
                    'description': 'The Fulbright Foreign Student Program enables graduate students, young professionals and artists from abroad to study and conduct research in the United States.',
                    'summary': 'International graduate scholarship program in the United States',
                    'scholarship_type': 'merit-based',
                    'study_level': 'graduate',
                    'field_of_study': 'All academic fields',
                    'location_type': 'specific-country',
                    'country': 'United States',
                    'amount_min': 30000,
                    'amount_max': 50000,
                    'currency': 'USD',
                    'funding_type': 'full',
                    'renewable': False,
                    'duration_years': 2,
                    'min_gpa': 3.5,
                    'nationality_requirements': '["International Students (Non-US)"]',
                    'gender_requirements': 'any',
                    'other_requirements': 'Must return to home country for at least two years after completion',
                    'application_deadline': datetime.utcnow() + timedelta(days=180),
                    'application_type': 'external',
                    'application_url': 'https://foreign.fulbrightonline.org',
                    'application_instructions': 'Apply through your home country Fulbright office',
                    'required_documents': '["Academic Transcripts", "Language Proficiency", "Research Proposal"]',
                    'requires_transcript': True,
                    'requires_recommendation_letters': True,
                    'num_recommendation_letters': 3,
                    'requires_essay': True,
                    'essay_topics': '["Statement of Purpose", "Research Goals"]',
                    'requires_portfolio': False,
                    'status': 'published',
                    'source_url': 'https://us.fulbrightonline.org/about/foreign-student-program'
                },
                {
                    'title': 'Rhodes Scholarship',
                    'external_organization_name': 'Rhodes Trust',
                    'external_organization_website': 'https://www.rhodeshouse.ox.ac.uk',
                    'description': 'The Rhodes Scholarships are the oldest and most celebrated international fellowship awards in the world. Each year they bring outstanding students to the University of Oxford.',
                    'summary': 'Prestigious scholarship for graduate study at Oxford University',
                    'scholarship_type': 'merit-based',
                    'study_level': 'graduate',
                    'field_of_study': 'Any field offered at Oxford',
                    'location_type': 'specific-country',
                    'country': 'United Kingdom',
                    'amount_min': 60000,
                    'amount_max': 80000,
                    'currency': 'GBP',
                    'funding_type': 'full',
                    'renewable': True,
                    'duration_years': 3,
                    'min_gpa': 3.8,
                    'max_age': 24,
                    'nationality_requirements': '["Various Countries", "Check eligibility by country"]',
                    'gender_requirements': 'any',
                    'other_requirements': 'Exceptional academic achievement, leadership, and service to others',
                    'application_deadline': datetime.utcnow() + timedelta(days=90),
                    'application_type': 'external',
                    'application_url': 'https://www.rhodeshouse.ox.ac.uk/scholarships/apply',
                    'application_instructions': 'Country-specific application process through national committees',
                    'required_documents': '["Academic Transcripts", "Personal Statement", "CV"]',
                    'requires_transcript': True,
                    'requires_recommendation_letters': True,
                    'num_recommendation_letters': 4,
                    'requires_essay': True,
                    'essay_topics': '["Personal Statement", "Why Oxford", "Future Plans"]',
                    'requires_portfolio': False,
                    'status': 'published',
                    'source_url': 'https://www.rhodeshouse.ox.ac.uk'
                },
                {
                    'title': 'Chevening Scholarships',
                    'external_organization_name': 'UK Government',
                    'external_organization_website': 'https://www.chevening.org',
                    'description': 'Chevening Scholarships are awarded to outstanding emerging leaders to pursue a one-year masters degree in the UK.',
                    'summary': 'UK government scholarships for international students',
                    'scholarship_type': 'merit-based',
                    'study_level': 'graduate',
                    'field_of_study': 'Any masters program in the UK',
                    'location_type': 'specific-country',
                    'country': 'United Kingdom',
                    'amount_min': 40000,
                    'amount_max': 60000,
                    'currency': 'GBP',
                    'funding_type': 'full',
                    'renewable': False,
                    'duration_years': 1,
                    'min_gpa': 3.0,
                    'nationality_requirements': '["Chevening-eligible countries"]',
                    'gender_requirements': 'any',
                    'other_requirements': 'Must return to home country for at least two years',
                    'application_deadline': datetime.utcnow() + timedelta(days=150),
                    'application_type': 'external',
                    'application_url': 'https://www.chevening.org/apply',
                    'application_instructions': 'Online application with essays and supporting documents',
                    'required_documents': '["Degree Certificates", "English Language Test", "References"]',
                    'requires_transcript': True,
                    'requires_recommendation_letters': True,
                    'num_recommendation_letters': 2,
                    'requires_essay': True,
                    'essay_topics': '["Leadership", "Networking", "Study Plans", "Career Goals"]',
                    'requires_portfolio': False,
                    'status': 'published',
                    'source_url': 'https://www.chevening.org'
                },
                {
                    'title': 'DAAD Scholarships for Development-Related Postgraduate Courses',
                    'external_organization_name': 'German Academic Exchange Service (DAAD)',
                    'external_organization_website': 'https://www.daad.de',
                    'description': 'DAAD scholarships for students from developing countries to pursue development-related postgraduate studies in Germany.',
                    'summary': 'German government scholarships for development studies',
                    'scholarship_type': 'need-based',
                    'study_level': 'graduate',
                    'field_of_study': 'Development-related fields',
                    'location_type': 'specific-country',
                    'country': 'Germany',
                    'amount_min': 25000,
                    'amount_max': 35000,
                    'currency': 'EUR',
                    'funding_type': 'full',
                    'renewable': True,
                    'duration_years': 2,
                    'min_gpa': 3.0,
                    'nationality_requirements': '["Developing Countries"]',
                    'gender_requirements': 'any',
                    'other_requirements': 'At least two years of professional experience',
                    'application_deadline': datetime.utcnow() + timedelta(days=200),
                    'application_type': 'external',
                    'application_url': 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
                    'application_instructions': 'Apply through DAAD portal with all required documents',
                    'required_documents': '["University Degrees", "Language Certificate", "Motivation Letter"]',
                    'requires_transcript': True,
                    'requires_recommendation_letters': True,
                    'num_recommendation_letters': 2,
                    'requires_essay': True,
                    'essay_topics': '["Motivation Letter", "Development Goals"]',
                    'requires_portfolio': False,
                    'status': 'published',
                    'source_url': 'https://www.daad.de/scholarships'
                },
                {
                    'title': 'Google Anita Borg Memorial Scholarship',
                    'external_organization_name': 'Google',
                    'external_organization_website': 'https://www.google.com',
                    'description': 'The Google Anita Borg Memorial Scholarship was established to honor Dr. Anita Borg\'s vision of creating gender equality in the field of computer science.',
                    'summary': 'Scholarship for women in computer science and technology',
                    'scholarship_type': 'merit-based',
                    'study_level': 'undergraduate',
                    'field_of_study': 'Computer Science, Technology',
                    'location_type': 'any',
                    'amount_min': 10000,
                    'amount_max': 10000,
                    'currency': 'USD',
                    'funding_type': 'partial',
                    'renewable': True,
                    'duration_years': 1,
                    'min_gpa': 3.5,
                    'nationality_requirements': '["Various countries"]',
                    'gender_requirements': 'female',
                    'other_requirements': 'Must be studying computer science or related technical field',
                    'application_deadline': datetime.utcnow() + timedelta(days=160),
                    'application_type': 'external',
                    'application_url': 'https://www.google.com/scholarships',
                    'application_instructions': 'Online application with academic records and essays',
                    'required_documents': '["Academic Transcripts", "Resume"]',
                    'requires_transcript': True,
                    'requires_recommendation_letters': True,
                    'num_recommendation_letters': 1,
                    'requires_essay': True,
                    'essay_topics': '["Impact in Technology", "Leadership Experience"]',
                    'requires_portfolio': False,
                    'status': 'published',
                    'source_url': 'https://www.google.com/scholarships/anita-borg/'
                },
                {
                    'title': 'Rotary Peace Fellowship',
                    'external_organization_name': 'Rotary International',
                    'external_organization_website': 'https://www.rotary.org',
                    'description': 'Rotary Peace Fellowships fund up to 130 fellows each year to study at one of our peace centers.',
                    'summary': 'Fellowship for peace and conflict resolution studies',
                    'scholarship_type': 'merit-based',
                    'study_level': 'graduate',
                    'field_of_study': 'Peace studies, International relations',
                    'location_type': 'any',
                    'amount_min': 75000,
                    'amount_max': 75000,
                    'currency': 'USD',
                    'funding_type': 'full',
                    'renewable': False,
                    'duration_years': 2,
                    'min_gpa': 3.0,
                    'nationality_requirements': '["All countries"]',
                    'gender_requirements': 'any',
                    'other_requirements': 'Professional experience in peace-related field',
                    'application_deadline': datetime.utcnow() + timedelta(days=140),
                    'application_type': 'external',
                    'application_url': 'https://www.rotary.org/en/our-programs/peace-fellowships',
                    'application_instructions': 'Apply through local Rotary district',
                    'required_documents': '["Academic Records", "Professional Experience", "Language Proficiency"]',
                    'requires_transcript': True,
                    'requires_recommendation_letters': True,
                    'num_recommendation_letters': 3,
                    'requires_essay': True,
                    'essay_topics': '["Personal Statement", "Peace Work Experience"]',
                    'requires_portfolio': False,
                    'status': 'published',
                    'source_url': 'https://www.rotary.org/peace-fellowships'
                },
                {
                    'title': 'Commonwealth Scholarship',
                    'external_organization_name': 'Commonwealth Scholarship Commission',
                    'external_organization_website': 'https://cscuk.fcdo.gov.uk',
                    'description': 'Commonwealth Scholarships are aimed at students who would not otherwise be able to afford to study in the UK.',
                    'summary': 'UK scholarships for Commonwealth country students',
                    'scholarship_type': 'need-based',
                    'study_level': 'graduate',
                    'field_of_study': 'All subjects',
                    'location_type': 'specific-country',
                    'country': 'United Kingdom',
                    'amount_min': 35000,
                    'amount_max': 45000,
                    'currency': 'GBP',
                    'funding_type': 'full',
                    'renewable': True,
                    'duration_years': 3,
                    'min_gpa': 3.3,
                    'nationality_requirements': '["Commonwealth Countries"]',
                    'gender_requirements': 'any',
                    'other_requirements': 'Must be unable to afford UK study without scholarship',
                    'application_deadline': datetime.utcnow() + timedelta(days=110),
                    'application_type': 'external',
                    'application_url': 'https://cscuk.fcdo.gov.uk/apply/',
                    'application_instructions': 'Apply through national nominating agency',
                    'required_documents': '["Degree Certificates", "References", "Development Plan"]',
                    'requires_transcript': True,
                    'requires_recommendation_letters': True,
                    'num_recommendation_letters': 2,
                    'requires_essay': True,
                    'essay_topics': '["Development Impact Plan"]',
                    'requires_portfolio': False,
                    'status': 'published',
                    'source_url': 'https://cscuk.fcdo.gov.uk/'
                }
            ]
            
            created_count = 0
            
            for scholarship_data in sample_scholarships:
                # Generate unique slug
                slug = scholarship_data['title'].lower().replace(' ', '-').replace('&', 'and')
                counter = 1
                original_slug = slug
                while Scholarship.query.filter_by(slug=slug).first():
                    slug = f"{original_slug}-{counter}"
                    counter += 1
                
                # Get a random category
                category = random.choice(categories)
                
                # Create scholarship
                scholarship = Scholarship(
                    organization_id=None,  # External scholarships don't have organization profiles
                    category_id=category.id,
                    posted_by=external_admin.id,
                    slug=slug,
                    scholarship_source='external',
                    is_active=True,
                    published_at=datetime.utcnow(),
                    **scholarship_data
                )
                
                db.session.add(scholarship)
                created_count += 1
                print(f"📝 Created: {scholarship_data['title']}")
            
            db.session.commit()
            
            print("\n" + "=" * 50)
            print(f"✅ Successfully created {created_count} sample scholarships!")
            print(f"👤 Posted by: {external_admin.get_full_name()} ({external_admin.email})")
            print(f"📚 Distributed across {len(categories)} categories")
            
            return True
            
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating sample scholarships: {str(e)}")
        return False

def list_external_scholarships():
    """List all external scholarships"""
    try:
        print("📋 Listing External Scholarships")
        print("=" * 50)
        
        import src.main as main_module
        app = main_module.app
        
        with app.app_context():
            scholarships = Scholarship.query.filter_by(scholarship_source='external').order_by(Scholarship.created_at.desc()).all()
            
            if not scholarships:
                print("📝 No external scholarships found.")
                return True
            
            for scholarship in scholarships:
                print(f"🎓 {scholarship.title}")
                print(f"   Organization: {scholarship.external_organization_name}")
                print(f"   Type: {scholarship.scholarship_type}")
                print(f"   Level: {scholarship.study_level}")
                print(f"   Amount: {scholarship.get_amount_range()}")
                print(f"   Deadline: {scholarship.application_deadline.strftime('%Y-%m-%d')}")
                print(f"   Status: {scholarship.status}")
                print(f"   Posted by: {scholarship.poster.get_full_name()}")
                print("   " + "-" * 60)
            
            print(f"\n📊 Total external scholarships: {len(scholarships)}")
            return True
            
    except Exception as e:
        print(f"❌ Error listing scholarships: {str(e)}")
        return False

def main():
    """Main function"""
    print("🎓 External Scholarship Management")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == 'list':
        list_external_scholarships()
    else:
        print("Choose an option:")
        print("1. Create sample external scholarships")
        print("2. List existing external scholarships")
        
        choice = input("\nEnter your choice (1-2): ").strip()
        
        if choice == '1':
            create_sample_external_scholarships()
        elif choice == '2':
            list_external_scholarships()
        else:
            print("❌ Invalid choice. Please run again.")

if __name__ == "__main__":
    main()
