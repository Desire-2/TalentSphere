"""
Migration script to add job_types, expected_salary, and preferred_locations fields to job_seeker_profiles table
"""
from src.main import app, db

def migrate_preferences_fields():
    """Add new preference fields to job_seeker_profiles table"""
    with app.app_context():
        try:
            print("🔄 Starting preferences fields migration...")
            
            # Add new columns to job_seeker_profiles
            columns_to_add = [
                ("job_types", "TEXT"),
                ("expected_salary", "INTEGER"),
                ("preferred_locations", "TEXT")
            ]
            
            for column_name, column_type in columns_to_add:
                try:
                    # PostgreSQL syntax with IF NOT EXISTS
                    sql = f"ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS {column_name} {column_type};"
                    db.session.execute(db.text(sql))
                    print(f"✅ Added column: {column_name}")
                except Exception as e:
                    if "already exists" in str(e) or "duplicate column" in str(e).lower():
                        print(f"ℹ️  Column {column_name} already exists")
                    else:
                        print(f"⚠️  Error adding {column_name}: {str(e)}")
            
            db.session.commit()
            print("\n✅ Preferences fields migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Migration failed: {str(e)}")
            raise

if __name__ == "__main__":
    migrate_preferences_fields()
