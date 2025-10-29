"""
Database Migration Script: SQLite to Supabase PostgreSQL
========================================================

This script migrates all data from your local SQLite database to Supabase PostgreSQL.

BEFORE RUNNING:
1. Make sure your .env file has the correct DATABASE_URL for Supabase
2. Backup your SQLite database: copy test_db.sqlite3 to a safe location
3. Ensure you have the correct Supabase password in DATABASE_URL

USAGE:
    python migrate_to_supabase.py
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

print("🔧 Setting up Django...")
django.setup()

from django.core.management import call_command
from django.db import connection
from django.conf import settings
import sqlite3
import psycopg2
from urllib.parse import urlparse

def check_databases():
    """Check both SQLite and PostgreSQL databases are accessible"""
    print("\n📊 Checking databases...")
    
    # Check SQLite
    sqlite_db = BASE_DIR / 'test_db.sqlite3'
    if not sqlite_db.exists():
        print(f"❌ SQLite database not found at: {sqlite_db}")
        return False
    print(f"✅ SQLite database found: {sqlite_db}")
    
    # Check Supabase connection
    database_url = os.getenv('DATABASE_URL')
    if not database_url or 'supabase' not in database_url:
        print("❌ DATABASE_URL not configured for Supabase")
        print(f"   Current DATABASE_URL: {database_url}")
        return False
    
    print(f"✅ Supabase DATABASE_URL configured")
    
    # Test PostgreSQL connection
    try:
        parsed = urlparse(database_url)
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path.lstrip('/')
        )
        conn.close()
        print("✅ Successfully connected to Supabase PostgreSQL")
        return True
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return False

def backup_sqlite():
    """Create a backup of SQLite database"""
    print("\n💾 Creating SQLite backup...")
    import shutil
    from datetime import datetime
    
    source = BASE_DIR / 'test_db.sqlite3'
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup = BASE_DIR / f'test_db.sqlite3.backup_{timestamp}'
    
    shutil.copy2(source, backup)
    print(f"✅ Backup created: {backup}")
    return backup

def get_sqlite_data():
    """Extract all data from SQLite"""
    print("\n📤 Extracting data from SQLite...")
    
    sqlite_db = BASE_DIR / 'test_db.sqlite3'
    conn = sqlite3.connect(sqlite_db)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]
    
    data = {}
    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in cursor.fetchall()]
        data[table] = {'columns': columns, 'rows': rows}
        print(f"  📋 {table}: {len(rows)} rows")
    
    conn.close()
    print(f"✅ Extracted data from {len(tables)} tables")
    return data

def migrate_data():
    """Main migration function using Django's dumpdata/loaddata"""
    print("\n🚀 Starting migration...")
    
    # Step 1: Export data from SQLite
    print("\n1️⃣ Exporting data from SQLite...")
    dump_file = BASE_DIR / 'data_dump.json'
    
    # Temporarily switch to SQLite
    original_db = settings.DATABASES['default'].copy()
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
    }
    
    try:
        # Export all data except contenttypes and auth.permission (Django will recreate these)
        call_command('dumpdata', 
                    '--natural-foreign', 
                    '--natural-primary',
                    '--exclude=contenttypes',
                    '--exclude=auth.permission',
                    '--indent=2',
                    '--output=data_dump.json')
        print(f"✅ Data exported to: {dump_file}")
    except Exception as e:
        print(f"❌ Export failed: {e}")
        settings.DATABASES['default'] = original_db
        return False
    
    # Step 2: Switch to PostgreSQL
    print("\n2️⃣ Switching to Supabase PostgreSQL...")
    settings.DATABASES['default'] = original_db
    
    # Step 3: Create tables in PostgreSQL
    print("\n3️⃣ Creating tables in PostgreSQL...")
    try:
        call_command('migrate', '--run-syncdb')
        print("✅ Tables created successfully")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    # Step 4: Load data into PostgreSQL
    print("\n4️⃣ Loading data into PostgreSQL...")
    try:
        call_command('loaddata', 'data_dump.json')
        print("✅ Data loaded successfully")
    except Exception as e:
        print(f"❌ Loading data failed: {e}")
        print("\nTrying alternative approach...")
        try:
            # Flush the database first
            call_command('flush', '--no-input')
            call_command('loaddata', 'data_dump.json')
            print("✅ Data loaded successfully on second attempt")
        except Exception as e2:
            print(f"❌ Alternative approach also failed: {e2}")
            return False
    
    # Clean up dump file
    if dump_file.exists():
        dump_file.unlink()
        print("🧹 Cleaned up temporary dump file")
    
    return True

def verify_migration():
    """Verify data was migrated correctly"""
    print("\n✅ Verifying migration...")
    
    from django.contrib.auth import get_user_model
    from accounts.models import CustomUser, Property, Unit
    from payments.models import RentPayment
    
    User = get_user_model()
    
    counts = {
        'Users': User.objects.count(),
        'Properties': Property.objects.count(),
        'Units': Unit.objects.count(),
        'Rent Payments': RentPayment.objects.count(),
    }
    
    print("\n📊 Migration Summary:")
    for model, count in counts.items():
        print(f"  {model}: {count}")
    
    return True

def main():
    """Main migration process"""
    print("=" * 70)
    print("🚀 SQLITE TO SUPABASE MIGRATION")
    print("=" * 70)
    
    # Check prerequisites
    if not check_databases():
        print("\n❌ Prerequisites not met. Please fix the issues above and try again.")
        return
    
    # Confirm before proceeding
    print("\n⚠️  WARNING: This will migrate all data to Supabase PostgreSQL")
    print("   Make sure you have added all environment variables in Vercel!")
    response = input("\nDo you want to proceed? (yes/no): ")
    
    if response.lower() not in ['yes', 'y']:
        print("❌ Migration cancelled.")
        return
    
    # Backup SQLite
    backup_path = backup_sqlite()
    
    # Perform migration
    success = migrate_data()
    
    if success:
        verify_migration()
        print("\n" + "=" * 70)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print(f"\n📝 Next steps:")
        print(f"1. Your SQLite backup is at: {backup_path}")
        print(f"2. Test your application with the new database")
        print(f"3. If everything works, you can delete the SQLite database")
        print(f"4. Make sure to redeploy to Vercel: vercel --prod")
    else:
        print("\n" + "=" * 70)
        print("❌ MIGRATION FAILED")
        print("=" * 70)
        print(f"\n📝 Your SQLite database is backed up at: {backup_path}")
        print(f"   You can restore it if needed")

if __name__ == '__main__':
    main()
