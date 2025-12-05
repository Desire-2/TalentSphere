#!/usr/bin/env python3
"""Generate requirements.txt with latest package versions"""

import subprocess
import re

packages = [
    # Core Flask Dependencies
    "Flask",
    "flask-cors",
    "Flask-SQLAlchemy",
    "flask-jwt-extended",
    "flask-bcrypt",
    "python-dotenv",
    
    # Database Dependencies
    "psycopg2-binary",
    "SQLAlchemy",
    "sqlalchemy-utils",
    
    # Server Dependencies
    "gunicorn",
    
    # Performance & Caching
    "redis",
    "psutil",
    "setproctitle",
    
    # Security & Authentication
    "PyJWT",
    "bcrypt",
    
    # Core Python Dependencies
    "blinker",
    "click",
    "itsdangerous",
    "Jinja2",
    "MarkupSafe",
    "typing_extensions",
    "Werkzeug",
]

def get_latest_version(package):
    """Get the latest version of a package from pip"""
    try:
        result = subprocess.run(
            ["pip", "index", "versions", package],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Parse the output to find latest version
        output = result.stdout
        match = re.search(r'LATEST:\s+(\S+)', output)
        if match:
            return match.group(1)
        
        # Alternative: parse from Available versions line
        match = re.search(rf'{package}\s+\(([^)]+)\)', output, re.IGNORECASE)
        if match:
            return match.group(1)
            
    except Exception as e:
        print(f"Error getting version for {package}: {e}")
    
    return None

def generate_requirements():
    """Generate new requirements.txt with latest versions"""
    requirements = []
    
    print("Fetching latest package versions...\n")
    
    categories = {
        "Core Flask Dependencies": ["Flask", "flask-cors", "Flask-SQLAlchemy", "flask-jwt-extended", "flask-bcrypt", "python-dotenv"],
        "Database Dependencies": ["psycopg2-binary", "SQLAlchemy", "sqlalchemy-utils"],
        "Server Dependencies": ["gunicorn"],
        "Performance & Caching": ["redis", "psutil", "setproctitle"],
        "Security & Authentication": ["PyJWT", "bcrypt"],
        "Core Python Dependencies": ["blinker", "click", "itsdangerous", "Jinja2", "MarkupSafe", "typing_extensions", "Werkzeug"],
    }
    
    for category, pkgs in categories.items():
        requirements.append(f"\n# {category}")
        for package in pkgs:
            version = get_latest_version(package)
            if version:
                line = f"{package}=={version}"
                requirements.append(line)
                print(f"✓ {line}")
            else:
                print(f"✗ Could not get version for {package}")
    
    # Write to file
    output_file = "requirements.txt"
    with open(output_file, 'w') as f:
        f.write('\n'.join(requirements))
        f.write('\n')
    
    print(f"\n✅ Generated {output_file} with latest versions!")

if __name__ == "__main__":
    generate_requirements()
