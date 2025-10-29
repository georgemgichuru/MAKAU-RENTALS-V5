"""
Import Data to PostgreSQL (Run this on Vercel or after connecting to Supabase)
==============================================================================

This script imports the exported JSON data into PostgreSQL.

IMPORTANT: Run this AFTER deploying to Vercel and setting up environment variables.

Usage (on Vercel or with Supabase connection):
    python import_data.py database_export_XXXXXX.json
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

django.setup()

from django.core.management import call_command

def import_data(json_file):
    """Import data from JSON file"""
    print("=" * 70)
    print("📥 IMPORTING DATA TO POSTGRESQL")
    print("=" * 70)
    
    if not os.path.exists(json_file):
        print(f"❌ File not found: {json_file}")
        return False
    
    print(f"\n📝 Importing from: {json_file}")
    
    # Step 1: Create tables
    print("\n1️⃣ Creating database tables...")
    try:
        call_command('migrate', '--run-syncdb')
        print("✅ Tables created")
    except Exception as e:
        print(f"⚠️  Migration warning: {e}")
    
    # Step 2: Load data
    print("\n2️⃣ Loading data...")
    try:
        call_command('loaddata', json_file)
        print("✅ Data loaded successfully!")
        
        # Verify
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_count = User.objects.count()
        print(f"\n📊 Verification:")
        print(f"   Users in database: {user_count}")
        
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        print("\nTrying alternative approach...")
        try:
            call_command('flush', '--no-input')
            call_command('loaddata', json_file)
            print("✅ Data loaded on second attempt!")
            return True
        except Exception as e2:
            print(f"❌ Alternative also failed: {e2}")
            return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python import_data.py <json_file>")
        print("\nAvailable export files:")
        for file in Path('.').glob('database_export_*.json'):
            print(f"  - {file.name}")
        sys.exit(1)
    
    json_file = sys.argv[1]
    import_data(json_file)
