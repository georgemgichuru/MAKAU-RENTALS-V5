"""
Verify Supabase Database Connection and Run Migrations
This script should be run once after deployment to set up the database.
"""
import os
import sys
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

import django
django.setup()

from django.core.management import call_command
from django.db import connection

def test_database_connection():
    """Test if we can connect to the database"""
    print("=" * 70)
    print("🔍 TESTING SUPABASE DATABASE CONNECTION")
    print("=" * 70)
    
    try:
        # Test connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"\n✅ Connected to PostgreSQL!")
            print(f"📊 Version: {version[:80]}...")
            
            # Check if tables exist
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            table_count = cursor.fetchone()[0]
            print(f"📋 Tables in database: {table_count}")
            
            if table_count == 0:
                print("\n⚠️  No tables found! Need to run migrations.")
                return False
            else:
                print(f"\n✅ Database has {table_count} tables")
                return True
                
    except Exception as e:
        print(f"\n❌ Database connection failed: {e}")
        return False

def run_migrations():
    """Run database migrations"""
    print("\n" + "=" * 70)
    print("🔧 RUNNING DATABASE MIGRATIONS")
    print("=" * 70)
    
    try:
        print("\n1️⃣ Running migrations...")
        call_command('migrate', verbosity=2)
        print("\n✅ Migrations completed successfully!")
        return True
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        return False

def create_superuser():
    """Create superuser if configured in environment"""
    print("\n" + "=" * 70)
    print("👤 CREATING SUPERUSER")
    print("=" * 70)
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
    
    if not all([username, email, password]):
        print("\n⚠️  Superuser credentials not found in environment variables")
        return False
    
    try:
        if User.objects.filter(username=username).exists():
            print(f"\n✅ Superuser '{username}' already exists")
            return True
        
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print(f"\n✅ Superuser '{username}' created successfully!")
        return True
    except Exception as e:
        print(f"\n❌ Failed to create superuser: {e}")
        return False

def main():
    """Main setup function"""
    print("\n🚀 SUPABASE DATABASE SETUP FOR VERCEL")
    print("=" * 70)
    
    # Step 1: Test connection
    if not test_database_connection():
        print("\n❌ Cannot proceed without database connection")
        return
    
    # Step 2: Check if migrations needed
    print("\n📋 Checking migration status...")
    try:
        call_command('showmigrations')
    except:
        pass
    
    # Step 3: Run migrations
    run_migrations()
    
    # Step 4: Verify tables created
    test_database_connection()
    
    # Step 5: Create superuser
    create_superuser()
    
    # Step 6: Summary
    print("\n" + "=" * 70)
    print("✅ DATABASE SETUP COMPLETE!")
    print("=" * 70)
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    print(f"\n📊 Database Statistics:")
    print(f"   Total users: {User.objects.count()}")
    
    try:
        from accounts.models import Property, Unit
        print(f"   Properties: {Property.objects.count()}")
        print(f"   Units: {Unit.objects.count()}")
    except:
        pass
    
    print("\n🎉 Your backend is ready!")
    print(f"   Admin: https://makau-rentals-v5.vercel.app/admin/")
    print(f"   API: https://makau-rentals-v5.vercel.app/api/")

if __name__ == '__main__':
    main()
