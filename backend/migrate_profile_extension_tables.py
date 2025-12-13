#!/usr/bin/env python3
"""
Migration script to create profile extension tables for CV builder
Creates: work_experiences, educations, certifications, projects, awards, languages, volunteer_experiences
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create database connection from environment variables"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")
    return psycopg2.connect(database_url)

def create_tables(conn):
    """Create all profile extension tables"""
    cursor = conn.cursor()
    
    tables_created = []
    tables_skipped = []
    
    # SQL statements for each table
    table_definitions = {
        'work_experiences': """
            CREATE TABLE IF NOT EXISTS work_experiences (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                job_title VARCHAR(150) NOT NULL,
                company_name VARCHAR(150) NOT NULL,
                company_location VARCHAR(150),
                employment_type VARCHAR(50),
                start_date DATE NOT NULL,
                end_date DATE,
                is_current BOOLEAN DEFAULT FALSE,
                description TEXT,
                key_responsibilities TEXT,
                achievements TEXT,
                technologies_used TEXT,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_work_experiences_user_id ON work_experiences(user_id);
            CREATE INDEX IF NOT EXISTS idx_work_experiences_current ON work_experiences(is_current);
        """,
        
        'educations': """
            CREATE TABLE IF NOT EXISTS educations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                institution_name VARCHAR(200) NOT NULL,
                institution_location VARCHAR(150),
                degree_type VARCHAR(50),
                field_of_study VARCHAR(150),
                degree_title VARCHAR(200),
                start_date DATE,
                end_date DATE,
                graduation_date DATE,
                is_current BOOLEAN DEFAULT FALSE,
                gpa FLOAT,
                gpa_scale FLOAT DEFAULT 4.0,
                honors VARCHAR(100),
                relevant_coursework TEXT,
                activities TEXT,
                description TEXT,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_educations_user_id ON educations(user_id);
        """,
        
        'certifications': """
            CREATE TABLE IF NOT EXISTS certifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(200) NOT NULL,
                issuing_organization VARCHAR(200) NOT NULL,
                credential_id VARCHAR(100),
                credential_url VARCHAR(255),
                issue_date DATE,
                expiry_date DATE,
                does_not_expire BOOLEAN DEFAULT FALSE,
                description TEXT,
                skills_acquired TEXT,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);
        """,
        
        'projects': """
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                role VARCHAR(100),
                project_url VARCHAR(255),
                github_url VARCHAR(255),
                demo_url VARCHAR(255),
                start_date DATE,
                end_date DATE,
                is_ongoing BOOLEAN DEFAULT FALSE,
                technologies_used TEXT,
                key_features TEXT,
                outcomes TEXT,
                team_size INTEGER,
                images TEXT,
                display_order INTEGER DEFAULT 0,
                is_featured BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
            CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured);
        """,
        
        'awards': """
            CREATE TABLE IF NOT EXISTS awards (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                issuer VARCHAR(200) NOT NULL,
                date_received DATE,
                description TEXT,
                award_url VARCHAR(255),
                certificate_url VARCHAR(255),
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_awards_user_id ON awards(user_id);
        """,
        
        'languages': """
            CREATE TABLE IF NOT EXISTS languages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                language VARCHAR(100) NOT NULL,
                proficiency_level VARCHAR(50) NOT NULL,
                certification VARCHAR(200),
                certification_score VARCHAR(50),
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_languages_user_id ON languages(user_id);
        """,
        
        'volunteer_experiences': """
            CREATE TABLE IF NOT EXISTS volunteer_experiences (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                organization VARCHAR(200) NOT NULL,
                role VARCHAR(150) NOT NULL,
                cause VARCHAR(100),
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT FALSE,
                description TEXT,
                achievements TEXT,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_volunteer_experiences_user_id ON volunteer_experiences(user_id);
        """
    }
    
    print("\n" + "="*70)
    print("  Creating Profile Extension Tables for CV Builder")
    print("="*70)
    
    # Create each table
    for table_name, create_sql in table_definitions.items():
        try:
            # Check if table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = %s
                );
            """, (table_name,))
            
            table_exists = cursor.fetchone()[0]
            
            if table_exists:
                print(f"  ⚪ Table '{table_name}' already exists - skipping")
                tables_skipped.append(table_name)
            else:
                cursor.execute(create_sql)
                conn.commit()
                print(f"  ✅ Created table '{table_name}'")
                tables_created.append(table_name)
                
        except Exception as e:
            print(f"  ❌ Error creating table '{table_name}': {str(e)}")
            conn.rollback()
            raise
    
    cursor.close()
    
    return tables_created, tables_skipped

def verify_tables(conn):
    """Verify all tables were created successfully"""
    cursor = conn.cursor()
    
    expected_tables = [
        'work_experiences', 'educations', 'certifications', 
        'projects', 'awards', 'languages', 'volunteer_experiences'
    ]
    
    print("\n" + "="*70)
    print("  Verifying Table Structure")
    print("="*70)
    
    for table_name in expected_tables:
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position;
        """, (table_name,))
        
        columns = cursor.fetchall()
        print(f"\n📋 {table_name} ({len(columns)} columns):")
        for col_name, col_type in columns[:5]:  # Show first 5 columns
            print(f"  • {col_name}: {col_type}")
        if len(columns) > 5:
            print(f"  • ... and {len(columns) - 5} more columns")
    
    cursor.close()

def main():
    """Main migration function"""
    print("\n🚀 Starting Profile Extension Tables Migration")
    print("="*70)
    
    try:
        # Connect to database
        print("📊 Connecting to database...")
        conn = get_db_connection()
        
        # Create tables
        tables_created, tables_skipped = create_tables(conn)
        
        # Print summary
        print("\n" + "="*70)
        print("  Migration Summary")
        print("="*70)
        print(f"  ✅ Tables created: {len(tables_created)}")
        if tables_created:
            for table in tables_created:
                print(f"     • {table}")
        print(f"  ⚪ Tables skipped (already exist): {len(tables_skipped)}")
        if tables_skipped:
            for table in tables_skipped:
                print(f"     • {table}")
        
        # Verify tables
        verify_tables(conn)
        
        # Close connection
        conn.close()
        
        print("\n✅ Migration completed successfully!")
        print("="*70 + "\n")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        print("="*70 + "\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
