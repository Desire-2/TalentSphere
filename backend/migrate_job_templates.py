#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from src.main import app
from src.models.user import db
from src.models.job_template import JobTemplate

def migrate_job_templates():
    """Create job templates table and add sample data"""
    try:
        with app.app_context():
            # Create the job_templates table
            db.create_all()
            print("✅ Job templates table created successfully")
            
            # Check if we need to add sample templates
            existing_templates = JobTemplate.query.count()
            if existing_templates == 0:
                print("📝 Adding sample job templates...")
                
                # Get admin user (assuming ID 1 exists)
                from src.models.user import User
                admin_user = User.query.filter_by(role='admin').first()
                if not admin_user:
                    admin_user = User.query.first()  # Fallback to first user
                
                if admin_user:
                    # Add sample templates
                    sample_templates = [
                        {
                            'name': 'Software Engineer Template',
                            'description': 'Standard template for software engineering positions',
                            'title': 'Senior Software Engineer',
                            'summary': 'We are looking for an experienced software engineer to join our dynamic development team.',
                            'job_description': '''As a Senior Software Engineer, you will be responsible for designing, developing, and maintaining high-quality software applications. You will work closely with cross-functional teams to deliver innovative solutions that meet our business objectives.

Key Responsibilities:
• Design and develop scalable software solutions
• Collaborate with product managers and designers
• Write clean, maintainable, and efficient code
• Participate in code reviews and technical discussions
• Mentor junior developers
• Stay up-to-date with emerging technologies''',
                            'requirements': '''• Bachelor's degree in Computer Science or related field
• 5+ years of experience in software development
• Proficiency in modern programming languages (Python, JavaScript, Java, etc.)
• Experience with database design and management
• Strong problem-solving and analytical skills
• Excellent communication and teamwork abilities
• Experience with version control systems (Git)''',
                            'preferred_skills': '''• Experience with cloud platforms (AWS, Azure, GCP)
• Knowledge of containerization (Docker, Kubernetes)
• Familiarity with CI/CD pipelines
• Experience with microservices architecture
• Understanding of agile development methodologies''',
                            'employment_type': 'full-time',
                            'experience_level': 'senior',
                            'location_type': 'hybrid',
                            'salary_min': 90000,
                            'salary_max': 130000,
                            'salary_currency': 'USD',
                            'salary_period': 'yearly',
                            'application_type': 'external',
                            'application_url': 'https://company.com/careers/apply',
                            'is_active': True,
                            'is_public': True,
                            'tags': '["React", "Node.js", "JavaScript", "Python", "AWS"]'
                        },
                        {
                            'name': 'Marketing Manager Template',
                            'description': 'Template for marketing management roles',
                            'title': 'Digital Marketing Manager',
                            'summary': 'Join our marketing team as a Digital Marketing Manager to lead our online marketing efforts.',
                            'job_description': '''We are seeking a results-driven Digital Marketing Manager to develop and execute comprehensive digital marketing strategies. You will manage multiple channels and campaigns to drive brand awareness and customer acquisition.

Key Responsibilities:
• Develop and implement digital marketing strategies
• Manage social media presence and campaigns
• Oversee content creation and marketing automation
• Analyze campaign performance and ROI
• Collaborate with sales and product teams
• Manage marketing budget and vendor relationships''',
                            'requirements': '''• Bachelor's degree in Marketing, Business, or related field
• 3+ years of digital marketing experience
• Proficiency in marketing analytics tools (Google Analytics, etc.)
• Experience with social media platforms and advertising
• Strong analytical and project management skills
• Excellent written and verbal communication skills''',
                            'preferred_skills': '''• Experience with marketing automation platforms
• Knowledge of SEO/SEM best practices
• Familiarity with content management systems
• Experience with A/B testing and conversion optimization
• Understanding of customer journey mapping''',
                            'employment_type': 'full-time',
                            'experience_level': 'mid',
                            'location_type': 'remote',
                            'salary_min': 70000,
                            'salary_max': 95000,
                            'salary_currency': 'USD',
                            'salary_period': 'yearly',
                            'application_type': 'email',
                            'application_email': 'jobs@company.com',
                            'is_active': True,
                            'is_public': True,
                            'tags': '["Digital Marketing", "SEO", "SEM", "Analytics", "Social Media"]'
                        },
                        {
                            'name': 'Customer Service Representative Template',
                            'description': 'Template for customer service positions',
                            'title': 'Customer Service Representative',
                            'summary': 'We are looking for a friendly and professional Customer Service Representative to join our support team.',
                            'job_description': '''As a Customer Service Representative, you will be the first point of contact for our customers. You will handle inquiries, resolve issues, and ensure customer satisfaction while maintaining our high service standards.

Key Responsibilities:
• Respond to customer inquiries via phone, email, and chat
• Resolve customer complaints and issues promptly
• Process orders, returns, and exchanges
• Maintain accurate customer records
• Escalate complex issues to supervisors
• Provide product information and support''',
                            'requirements': '''• High school diploma or equivalent
• 1+ years of customer service experience
• Excellent communication and interpersonal skills
• Strong problem-solving abilities
• Proficiency in computer applications
• Ability to work in a fast-paced environment
• Positive attitude and patience''',
                            'preferred_skills': '''• Experience with CRM systems
• Multilingual capabilities
• Previous experience in retail or hospitality
• Knowledge of our products/services
• Conflict resolution training''',
                            'employment_type': 'full-time',
                            'experience_level': 'entry',
                            'location_type': 'on-site',
                            'salary_min': 35000,
                            'salary_max': 45000,
                            'salary_currency': 'USD',
                            'salary_period': 'yearly',
                            'application_type': 'internal',
                            'is_active': True,
                            'is_public': True,
                            'tags': '["Customer Service", "Communication", "CRM", "Support"]'
                        }
                    ]
                    
                    for template_data in sample_templates:
                        template = JobTemplate(
                            created_by=admin_user.id,
                            **template_data
                        )
                        db.session.add(template)
                    
                    db.session.commit()
                    print(f"✅ Added {len(sample_templates)} sample job templates")
                else:
                    print("⚠️ No users found, skipping sample template creation")
            else:
                print(f"📋 Found {existing_templates} existing templates, skipping sample creation")
            
            return True
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == '__main__':
    success = migrate_job_templates()
    if success:
        print("🎉 Job templates migration completed successfully!")
    else:
        print("💥 Job templates migration failed!")
        sys.exit(1)
