"""
Simple Data Export Script
=========================
Exports your SQLite data to JSON format that can be imported on Vercel.

Usage:
    python export_data.py
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

# Force SQLite temporarily
import app.settings as settings
settings.DATABASES['default'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': BASE_DIR / 'test_db.sqlite3',
}

django.setup()

from django.core.management import call_command
from datetime import datetime

def export_data():
    """Export all data to JSON"""
    print("=" * 70)
    print("📤 EXPORTING DATA FROM SQLITE")
    print("=" * 70)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'database_export_{timestamp}.json'
    
    print(f"\n📝 Exporting data to: {output_file}")
    
    try:
        call_command('dumpdata',
                    '--natural-foreign',
                    '--natural-primary',
                    '--exclude=contenttypes',
                    '--exclude=auth.permission',
                    '--exclude=sessions.session',
                    '--indent=2',
                    f'--output={output_file}')
        
        print(f"\n✅ Export completed successfully!")
        print(f"📁 File saved: {output_file}")
        print(f"\n📋 Next steps:")
        print(f"1. Upload this file to your Vercel backend")
        print(f"2. Run the import script on Vercel")
        
        # Show file size
        file_size = os.path.getsize(output_file) / 1024  # KB
        print(f"\n📊 Export size: {file_size:.2f} KB")
        
    except Exception as e:
        print(f"\n❌ Export failed: {e}")
        return False
    
    return True

if __name__ == '__main__':
    export_data()
