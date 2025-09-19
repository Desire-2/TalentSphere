#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Direct SQL approach to create the table
import sqlite3
from datetime import datetime

def create_template_table_sqlite():
    """Create job templates table in SQLite database"""
    try:
        # Use the SQLite database directly
        db_path = os.path.join(os.path.dirname(__file__), 'talentsphere.db')
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create job_templates table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                title VARCHAR(255) NOT NULL,
                summary TEXT,
                job_description TEXT,
                requirements TEXT,
                preferred_skills TEXT,
                employment_type VARCHAR(50),
                experience_level VARCHAR(50),
                location_type VARCHAR(50),
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100),
                is_remote BOOLEAN DEFAULT FALSE,
                salary_min INTEGER,
                salary_max INTEGER,
                salary_currency VARCHAR(10) DEFAULT 'USD',
                salary_period VARCHAR(20) DEFAULT 'yearly',
                benefits TEXT,
                application_type VARCHAR(50) DEFAULT 'internal',
                application_url VARCHAR(500),
                application_email VARCHAR(255),
                application_instructions TEXT,
                deadline DATE,
                category_id INTEGER,
                tags TEXT,
                usage_count INTEGER DEFAULT 0,
                last_used_at DATETIME,
                is_active BOOLEAN DEFAULT TRUE,
                is_public BOOLEAN DEFAULT FALSE,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        print("✅ Job templates table created successfully")
        
        # Check if we need to add sample templates
        cursor.execute("SELECT COUNT(*) FROM job_templates")
        existing_count = cursor.fetchone()[0]
        
        if existing_count == 0:
            print("📝 Adding sample job templates...")
            
            # Check if there's a user to assign templates to
            cursor.execute("SELECT id FROM users WHERE role = 'admin' OR role = 'external_admin' LIMIT 1")
            user_row = cursor.fetchone()
            
            if user_row:
                user_id = user_row[0]
                current_time = datetime.now().isoformat()
                
                # Add sample templates
                sample_templates = [
                    (
                        'Software Engineer Template',
                        'Standard template for software engineering positions',
                        'Senior Software Engineer',
                        'We are looking for an experienced software engineer to join our dynamic development team.',
                        '''As a Senior Software Engineer, you will be responsible for designing, developing, and maintaining high-quality software applications. You will work closely with cross-functional teams to deliver innovative solutions that meet our business objectives.

Key Responsibilities:
• Design and develop scalable software solutions
• Collaborate with product managers and designers
• Write clean, maintainable, and efficient code
• Participate in code reviews and technical discussions
• Mentor junior developers
• Stay up-to-date with emerging technologies''',
                        '''• Bachelor's degree in Computer Science or related field
• 5+ years of experience in software development
• Proficiency in modern programming languages (Python, JavaScript, Java, etc.)
• Experience with database design and management
• Strong problem-solving and analytical skills
• Excellent communication and teamwork abilities
• Experience with version control systems (Git)''',
                        '''• Experience with cloud platforms (AWS, Azure, GCP)
• Knowledge of containerization (Docker, Kubernetes)
• Familiarity with CI/CD pipelines
• Experience with microservices architecture
• Understanding of agile development methodologies''',
                        'full-time',
                        'senior',
                        'hybrid',
                        90000,
                        130000,
                        'USD',
                        'yearly',
                        'external',
                        'https://company.com/careers/apply',
                        '["React", "Node.js", "JavaScript", "Python", "AWS"]',
                        True,
                        True,
                        user_id,
                        current_time,
                        current_time
                    ),
                    (
                        'Marketing Manager Template',
                        'Template for marketing management roles',
                        'Digital Marketing Manager',
                        'Join our marketing team as a Digital Marketing Manager to lead our online marketing efforts.',
                        '''We are seeking a results-driven Digital Marketing Manager to develop and execute comprehensive digital marketing strategies. You will manage multiple channels and campaigns to drive brand awareness and customer acquisition.

Key Responsibilities:
• Develop and implement digital marketing strategies
• Manage social media presence and campaigns
• Oversee content creation and marketing automation
• Analyze campaign performance and ROI
• Collaborate with sales and product teams
• Manage marketing budget and vendor relationships''',
                        '''• Bachelor's degree in Marketing, Business, or related field
• 3+ years of digital marketing experience
• Proficiency in marketing analytics tools (Google Analytics, etc.)
• Experience with social media platforms and advertising
• Strong analytical and project management skills
• Excellent written and verbal communication skills''',
                        '''• Experience with marketing automation platforms
• Knowledge of SEO/SEM best practices
• Familiarity with content management systems
• Experience with A/B testing and conversion optimization
• Understanding of customer journey mapping''',
                        'full-time',
                        'mid',
                        'remote',
                        70000,
                        95000,
                        'USD',
                        'yearly',
                        'email',
                        'jobs@company.com',
                        '["Digital Marketing", "SEO", "SEM", "Analytics", "Social Media"]',
                        True,
                        True,
                        user_id,
                        current_time,
                        current_time
                    ),
                    (
                        'Customer Service Representative Template',
                        'Template for customer service positions',
                        'Customer Service Representative',
                        'We are looking for a friendly and professional Customer Service Representative to join our support team.',
                        '''As a Customer Service Representative, you will be the first point of contact for our customers. You will handle inquiries, resolve issues, and ensure customer satisfaction while maintaining our high service standards.

Key Responsibilities:
• Respond to customer inquiries via phone, email, and chat
• Resolve customer complaints and issues promptly
• Process orders, returns, and exchanges
• Maintain accurate customer records
• Escalate complex issues to supervisors
• Provide product information and support''',
                        '''• High school diploma or equivalent
• 1+ years of customer service experience
• Excellent communication and interpersonal skills
• Strong problem-solving abilities
• Proficiency in computer applications
• Ability to work in a fast-paced environment
• Positive attitude and patience''',
                        '''• Experience with CRM systems
• Multilingual capabilities
• Previous experience in retail or hospitality
• Knowledge of our products/services
• Conflict resolution training''',
                        'full-time',
                        'entry',
                        'on-site',
                        35000,
                        45000,
                        'USD',
                        'yearly',
                        'internal',
                        NULL,
                        '["Customer Service", "Communication", "CRM", "Support"]',
                        True,
                        True,
                        user_id,
                        current_time,
                        current_time
                    )
                ]
                
                cursor.executemany('''
                    INSERT INTO job_templates (
                        name, description, title, summary, job_description, requirements, 
                        preferred_skills, employment_type, experience_level, location_type,
                        salary_min, salary_max, salary_currency, salary_period,
                        application_type, application_url, application_email, tags,
                        is_active, is_public, created_by, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', [
                    (
                        template[0], template[1], template[2], template[3], template[4], template[5],
                        template[6], template[7], template[8], template[9], template[10], template[11],
                        template[12], template[13], template[14], template[15], template[16], template[17],
                        template[18], template[19], template[20], template[21], template[22]
                    ) for template in sample_templates
                ])
                
                print(f"✅ Added {len(sample_templates)} sample job templates")
            else:
                print("⚠️ No admin/external_admin users found, skipping sample template creation")
        else:
            print(f"📋 Found {existing_count} existing templates, skipping sample creation")
        
        conn.commit()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == '__main__':
    success = create_template_table_sqlite()
    if success:
        print("🎉 Job templates table creation completed successfully!")
    else:
        print("💥 Job templates table creation failed!")
        sys.exit(1)