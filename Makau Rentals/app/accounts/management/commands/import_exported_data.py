"""
Django management command to import data from JSON export
Usage: python manage.py import_exported_data database_export_XXXXXX.json
"""

from django.core.management.base import BaseCommand
from django.core.management import call_command
import os

class Command(BaseCommand):
    help = 'Import data from exported JSON file'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to the JSON export file')

    def handle(self, *args, **options):
        json_file = options['json_file']
        
        if not os.path.exists(json_file):
            self.stdout.write(self.style.ERROR(f'File not found: {json_file}'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Importing data from {json_file}...'))
        
        try:
            # Run migrations first
            self.stdout.write('Running migrations...')
            call_command('migrate', '--run-syncdb')
            
            # Load data
            self.stdout.write('Loading data...')
            call_command('loaddata', json_file)
            
            self.stdout.write(self.style.SUCCESS('Data imported successfully!'))
            
            # Verify
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_count = User.objects.count()
            self.stdout.write(self.style.SUCCESS(f'Total users in database: {user_count}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Import failed: {e}'))
