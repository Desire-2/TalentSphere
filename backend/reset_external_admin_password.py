#!/usr/bin/env python3
"""
Reset External Admin Password
This script resets the password for the external admin user.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

def reset_external_admin_password():
    """Reset external admin password"""
    # Import the app from main module
    import src.main as main_module
    app = main_module.app
    
    with app.app_context():
        from src.models.user import db, User
        
        # Find external admin user
        user = User.query.filter_by(email='afritechbridge@yahoo.com').first()
        
        if not user:
            print("❌ External admin user not found")
            return False
        
        # Set new password
        new_password = "Desire@123"
        user.set_password(new_password)
        
        try:
            db.session.commit()
            print("✅ Password reset successfully!")
            print(f"Email: {user.email}")
            print(f"New password: {new_password}")
            
            # Verify the password works
            if user.check_password(new_password):
                print("✅ Password verification successful!")
                return True
            else:
                print("❌ Password verification failed!")
                return False
                
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error resetting password: {str(e)}")
            return False

if __name__ == "__main__":
    print("🔑 Resetting External Admin Password")
    print("=" * 50)
    
    if reset_external_admin_password():
        print("\n🎉 External admin password has been reset!")
        print("You can now use the following credentials:")
        print("Email: afritechbridge@yahoo.com")
        print("Password: Desire@123")
    else:
        print("\n❌ Failed to reset password!")
        sys.exit(1)
