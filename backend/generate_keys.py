#!/usr/bin/env python3
"""
Generate secure keys for Flask application
This script generates cryptographically secure keys for:
- SECRET_KEY (Flask session security)
- JWT_SECRET_KEY (JWT token signing)
"""

import secrets
import string
import os

def generate_secret_key(length=64):
    """Generate a cryptographically secure secret key"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_+-=[]{}|;:,.<>?"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_hex_key(length=32):
    """Generate a hex-encoded secure key"""
    return secrets.token_hex(length)

def generate_urlsafe_key(length=32):
    """Generate a URL-safe base64 encoded key"""
    return secrets.token_urlsafe(length)

def main():
    print("🔐 Flask Security Key Generator")
    print("=" * 50)
    
    # Generate different types of keys
    secret_key = generate_secret_key(64)
    jwt_secret_key = generate_hex_key(32)
    simple_secret = generate_urlsafe_key(32)
    
    print("\n📋 Generated Keys:")
    print("-" * 30)
    print(f"SECRET_KEY (Complex):")
    print(f"'{secret_key}'")
    print(f"\nJWT_SECRET_KEY (Hex):")
    print(f"'{jwt_secret_key}'")
    print(f"\nSECRET_KEY (URL-Safe, simpler):")
    print(f"'{simple_secret}'")
    
    print("\n📝 .env Format:")
    print("-" * 30)
    print(f"SECRET_KEY='{secret_key}'")
    print(f"JWT_SECRET_KEY='{jwt_secret_key}'")
    
    # Offer to update .env file
    update_env = input("\n❓ Update .env file with these keys? (y/N): ").strip().lower()
    
    if update_env in ['y', 'yes']:
        env_file = '.env'
        if os.path.exists(env_file):
            # Read existing .env
            with open(env_file, 'r') as f:
                lines = f.readlines()
            
            # Update or add keys
            updated_lines = []
            secret_key_found = False
            jwt_key_found = False
            
            for line in lines:
                if line.startswith('SECRET_KEY='):
                    updated_lines.append(f"SECRET_KEY='{secret_key}'\n")
                    secret_key_found = True
                elif line.startswith('JWT_SECRET_KEY='):
                    updated_lines.append(f"JWT_SECRET_KEY='{jwt_secret_key}'\n")
                    jwt_key_found = True
                else:
                    updated_lines.append(line)
            
            # Add keys if not found
            if not secret_key_found:
                updated_lines.append(f"SECRET_KEY='{secret_key}'\n")
            if not jwt_key_found:
                updated_lines.append(f"JWT_SECRET_KEY='{jwt_secret_key}'\n")
            
            # Write back to file
            with open(env_file, 'w') as f:
                f.writelines(updated_lines)
            
            print(f"✅ Updated {env_file} with new secure keys!")
        else:
            # Create new .env file
            with open(env_file, 'w') as f:
                f.write(f"SECRET_KEY='{secret_key}'\n")
                f.write(f"JWT_SECRET_KEY='{jwt_secret_key}'\n")
                f.write("FLASK_ENV=development\n")
                f.write("# DATABASE_URL=your_database_url_here\n")
            
            print(f"✅ Created {env_file} with secure keys!")
    
    print("\n🔒 Security Notes:")
    print("- Keep these keys secret and never commit them to version control")
    print("- Use different keys for development and production")
    print("- Regenerate keys periodically for better security")
    print("- For production, use environment variables instead of .env files")

if __name__ == "__main__":
    main()
