#!/usr/bin/env python3
"""
Check database schema for ad_placements table
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

if __name__ == '__main__':
    from main import app, db
    import sqlalchemy as sa
    
    with app.app_context():
        inspector = sa.inspect(db.engine)
        
        # Get columns for ad_placements table
        columns = inspector.get_columns('ad_placements')
        print("\nAd Placements Table Columns:")
        print("=" * 60)
        for col in columns:
            nullable = "YES" if col['nullable'] else "NO"
            print(f"{col['name']:20} | Type: {str(col['type']):20} | Nullable: {nullable}")
