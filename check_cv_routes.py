#!/usr/bin/env python3
"""
Quick test to verify the CV builder quick-generate endpoint is registered
"""
import sys
sys.path.insert(0, '/home/desire/My_Project/TalentSphere/backend')

from src.routes.cv_builder import cv_builder_bp

print("🔍 CV Builder Routes:")
print("=" * 50)

# Get all routes from the blueprint
routes = []
for rule in cv_builder_bp.deferred_functions:
    if hasattr(rule, '__name__'):
        routes.append(rule.__name__)

# Also check the actual endpoint functions
import inspect
members = inspect.getmembers(sys.modules['src.routes.cv_builder'])
route_functions = [name for name, obj in members if inspect.isfunction(obj) and name.endswith(('_cv', 'cv_data', 'styles', 'cv_incremental', 'cv_targeted'))]

print("\n✅ Found route handler functions:")
for func_name in sorted(route_functions):
    print(f"   - {func_name}")

# Check if quick_generate_cv exists
if 'quick_generate_cv' in [name for name, obj in members]:
    print("\n✅ quick_generate_cv function found!")
else:
    print("\n❌ quick_generate_cv function NOT found")

print("\n" + "=" * 50)

# Now test importing and checking the actual route decorators
print("\n📋 Checking route definitions in cv_builder.py:")
with open('/home/desire/My_Project/TalentSphere/backend/src/routes/cv_builder.py', 'r') as f:
    content = f.read()
    routes = []
    for line in content.split('\n'):
        if '@cv_builder_bp.route(' in line:
            routes.append(line.strip())
    
    print(f"\n✅ Found {len(routes)} route definitions:")
    for route in routes:
        print(f"   {route}")
