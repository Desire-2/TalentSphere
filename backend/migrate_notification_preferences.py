"""
Database Migration: Add New Notification Preferences
Adds new_features_email, platform_updates_email, new_features_push, and platform_updates_push columns
"""

from sqlalchemy import text
from src.models.user import db

def upgrade():
    """Add new notification preference columns"""
    print("🔄 Adding new notification preference columns...")
    
    try:
        # Check if columns already exist (for idempotency)
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('notification_preferences')]
        
        migrations_needed = []
        
        # Check each new column
        if 'new_features_email' not in columns:
            migrations_needed.append(
                "ALTER TABLE notification_preferences ADD COLUMN new_features_email BOOLEAN DEFAULT TRUE"
            )
        
        if 'platform_updates_email' not in columns:
            migrations_needed.append(
                "ALTER TABLE notification_preferences ADD COLUMN platform_updates_email BOOLEAN DEFAULT TRUE"
            )
        
        if 'new_features_push' not in columns:
            migrations_needed.append(
                "ALTER TABLE notification_preferences ADD COLUMN new_features_push BOOLEAN DEFAULT TRUE"
            )
        
        if 'platform_updates_push' not in columns:
            migrations_needed.append(
                "ALTER TABLE notification_preferences ADD COLUMN platform_updates_push BOOLEAN DEFAULT TRUE"
            )
        
        # Execute migrations
        if migrations_needed:
            for migration in migrations_needed:
                print(f"   Executing: {migration}")
                db.session.execute(text(migration))
            
            db.session.commit()
            print(f"✅ Added {len(migrations_needed)} new columns successfully")
        else:
            print("✅ All columns already exist - no migration needed")
        
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Migration failed: {e}")
        return False

def downgrade():
    """Remove new notification preference columns"""
    print("🔄 Removing new notification preference columns...")
    
    try:
        # Check if columns exist
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('notification_preferences')]
        
        rollbacks_needed = []
        
        # Check each column
        if 'new_features_email' in columns:
            rollbacks_needed.append(
                "ALTER TABLE notification_preferences DROP COLUMN new_features_email"
            )
        
        if 'platform_updates_email' in columns:
            rollbacks_needed.append(
                "ALTER TABLE notification_preferences DROP COLUMN platform_updates_email"
            )
        
        if 'new_features_push' in columns:
            rollbacks_needed.append(
                "ALTER TABLE notification_preferences DROP COLUMN new_features_push"
            )
        
        if 'platform_updates_push' in columns:
            rollbacks_needed.append(
                "ALTER TABLE notification_preferences DROP COLUMN platform_updates_push"
            )
        
        # Execute rollbacks
        if rollbacks_needed:
            for rollback in rollbacks_needed:
                print(f"   Executing: {rollback}")
                db.session.execute(text(rollback))
            
            db.session.commit()
            print(f"✅ Removed {len(rollbacks_needed)} columns successfully")
        else:
            print("✅ No columns to remove - already rolled back")
        
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Rollback failed: {e}")
        return False

if __name__ == "__main__":
    import sys
    sys.path.insert(0, '/home/desire/My_Project/TalentSphere/backend')
    
    from src.main import app
    
    with app.app_context():
        print("="*60)
        print(" Notification Preferences Migration")
        print("="*60)
        
        action = input("\nChoose action (upgrade/downgrade): ").strip().lower()
        
        if action == "upgrade":
            success = upgrade()
        elif action == "downgrade":
            success = downgrade()
        else:
            print("❌ Invalid action. Use 'upgrade' or 'downgrade'")
            sys.exit(1)
        
        if success:
            print("\n✅ Migration completed successfully!")
            sys.exit(0)
        else:
            print("\n❌ Migration failed!")
            sys.exit(1)
