#!/usr/bin/env python3
"""
Database Migration for Scholarship System
This script migrates the database to support scholarship management for external admins.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.models.user import db
from src.models.scholarship import ScholarshipCategory, Scholarship, ScholarshipApplication, ScholarshipBookmark, ScholarshipAlert
import sqlite3

def create_scholarship_tables():
    """Create scholarship-related tables"""
    try:
        print("📊 Creating scholarship tables...")
        
        # Import the app to get the database context
        import src.main as main_module
        app = main_module.app
        
        with app.app_context():
            # Create all scholarship tables
            db.create_all()
            
            print("✅ Scholarship tables created successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error creating scholarship tables: {str(e)}")
        return False

def create_sample_scholarship_categories():
    """Create sample scholarship categories"""
    try:
        print("📚 Creating sample scholarship categories...")
        
        import src.main as main_module
        app = main_module.app
        
        with app.app_context():
            sample_categories = [
                {
                    'name': 'Academic Excellence',
                    'slug': 'academic-excellence',
                    'description': 'Merit-based scholarships for outstanding academic performance',
                    'icon': 'graduation-cap',
                    'color': '#3B82F6',
                    'display_order': 1
                },
                {
                    'name': 'STEM Fields',
                    'slug': 'stem-fields',
                    'description': 'Scholarships for Science, Technology, Engineering, and Mathematics',
                    'icon': 'flask',
                    'color': '#10B981',
                    'display_order': 2
                },
                {
                    'name': 'Arts & Humanities',
                    'slug': 'arts-humanities',
                    'description': 'Scholarships for creative and liberal arts studies',
                    'icon': 'palette',
                    'color': '#F59E0B',
                    'display_order': 3
                },
                {
                    'name': 'Business & Economics',
                    'slug': 'business-economics',
                    'description': 'Scholarships for business, finance, and economic studies',
                    'icon': 'briefcase',
                    'color': '#8B5CF6',
                    'display_order': 4
                },
                {
                    'name': 'Medical & Health Sciences',
                    'slug': 'medical-health',
                    'description': 'Scholarships for medical, nursing, and health-related fields',
                    'icon': 'heart',
                    'color': '#EF4444',
                    'display_order': 5
                },
                {
                    'name': 'Need-Based',
                    'slug': 'need-based',
                    'description': 'Financial aid scholarships based on economic need',
                    'icon': 'hand-heart',
                    'color': '#06B6D4',
                    'display_order': 6
                },
                {
                    'name': 'Minority & Diversity',
                    'slug': 'minority-diversity',
                    'description': 'Scholarships promoting diversity and inclusion',
                    'icon': 'users',
                    'color': '#84CC16',
                    'display_order': 7
                },
                {
                    'name': 'Sports & Athletics',
                    'slug': 'sports-athletics',
                    'description': 'Athletic scholarships for sports achievements',
                    'icon': 'trophy',
                    'color': '#F97316',
                    'display_order': 8
                },
                {
                    'name': 'International Students',
                    'slug': 'international-students',
                    'description': 'Scholarships specifically for international students',
                    'icon': 'globe',
                    'color': '#EC4899',
                    'display_order': 9
                },
                {
                    'name': 'Graduate & Research',
                    'slug': 'graduate-research',
                    'description': 'Scholarships for graduate studies and research programs',
                    'icon': 'search',
                    'color': '#6366F1',
                    'display_order': 10
                }
            ]
            
            created_count = 0
            for category_data in sample_categories:
                existing_category = ScholarshipCategory.query.filter_by(slug=category_data['slug']).first()
                if not existing_category:
                    category = ScholarshipCategory(**category_data)
                    db.session.add(category)
                    created_count += 1
            
            db.session.commit()
            print(f"✅ Created {created_count} scholarship categories!")
            return True
            
    except Exception as e:
        print(f"❌ Error creating scholarship categories: {str(e)}")
        db.session.rollback()
        return False

def verify_scholarship_migration():
    """Verify that the scholarship migration was successful"""
    try:
        print("🔍 Verifying scholarship migration...")
        
        import src.main as main_module
        app = main_module.app
        
        with app.app_context():
            # Check if scholarship tables exist
            tables_to_check = [
                'scholarship_categories',
                'scholarships', 
                'scholarship_applications',
                'scholarship_bookmarks',
                'scholarship_alerts'
            ]
            
            for table_name in tables_to_check:
                try:
                    result = db.session.execute(db.text(f"SELECT COUNT(*) FROM {table_name}"))
                    count = result.scalar()
                    print(f"✅ Table '{table_name}' exists with {count} records")
                except Exception as e:
                    print(f"❌ Table '{table_name}' verification failed: {str(e)}")
                    return False
            
            # Check scholarship categories
            categories_count = ScholarshipCategory.query.count()
            print(f"📚 Scholarship categories: {categories_count}")
            
            print("✅ Scholarship migration verification completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error verifying scholarship migration: {str(e)}")
        return False

def main():
    """Main migration function"""
    print("🚀 Starting Scholarship System Migration")
    print("=" * 50)
    
    success = True
    
    # Step 1: Create scholarship tables
    if not create_scholarship_tables():
        success = False
    
    # Step 2: Create sample scholarship categories
    if success and not create_sample_scholarship_categories():
        success = False
    
    # Step 3: Verify migration
    if success and not verify_scholarship_migration():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Scholarship System Migration Completed Successfully!")
        print("\n📋 What was created:")
        print("• Scholarship Categories table")
        print("• Scholarships table") 
        print("• Scholarship Applications table")
        print("• Scholarship Bookmarks table")
        print("• Scholarship Alerts table")
        print("• Sample scholarship categories")
        print("\n🎯 Next steps:")
        print("1. Update your main application to import scholarship routes")
        print("2. Create external admin accounts for scholarship management")
        print("3. Start posting scholarship opportunities")
        print("4. Configure frontend scholarship pages")
    else:
        print("❌ Scholarship System Migration Failed!")
        print("Please check the error messages above and try again.")
    
    return success

if __name__ == "__main__":
    main()
