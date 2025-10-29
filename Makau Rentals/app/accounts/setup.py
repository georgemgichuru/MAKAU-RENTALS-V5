"""
One-time database setup endpoint
THIS SHOULD BE DELETED AFTER USE FOR SECURITY!
"""
from django.http import JsonResponse
from django.core.management import call_command
from django.db import connection
from io import StringIO
import sys

def setup_database(request):
    """
    One-time endpoint to set up the database
    This will run migrations and create the superuser
    """
    # Security check - only allow if DEBUG is True or specific key is provided
    secret_key = request.GET.get('key')
    if secret_key != 'makau-setup-2024':  # Change this to a secret key
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    output = StringIO()
    results = {
        'steps': []
    }
    
    try:
        # Step 1: Test connection
        results['steps'].append('Testing database connection...')
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()[0]
                results['database_version'] = version[:80]
                results['steps'].append(f'✅ Connected to PostgreSQL')
        except Exception as db_error:
            results['steps'].append(f'❌ Database connection failed')
            results['connection_error'] = str(db_error)
            results['error_type'] = type(db_error).__name__
            results['error_args'] = str(db_error.args) if hasattr(db_error, 'args') else 'No args'
            
            # Try to get more info from settings
            from django.conf import settings
            import os
            
            results['debug_info'] = {
                'DATABASE_URL_exists': bool(os.environ.get('DATABASE_URL')),
                'DATABASE_URL_length': len(os.environ.get('DATABASE_URL', '')) if os.environ.get('DATABASE_URL') else 0,
                'DATABASE_ENGINE': settings.DATABASES['default'].get('ENGINE'),
                'DATABASE_NAME': settings.DATABASES['default'].get('NAME'),
                'DATABASE_HOST': settings.DATABASES['default'].get('HOST'),
                'DATABASE_PORT': settings.DATABASES['default'].get('PORT'),
            }
            raise db_error
        
        # Step 2: Run migrations
        results['steps'].append('Running migrations...')
        call_command('migrate', stdout=output, verbosity=2)
        results['migration_output'] = output.getvalue()
        results['steps'].append('✅ Migrations completed')
        
        # Step 3: Check tables
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            table_count = cursor.fetchone()[0]
            results['tables_created'] = table_count
            results['steps'].append(f'✅ {table_count} tables in database')
        
        # Step 4: Create superuser if needed
        from django.contrib.auth import get_user_model
        import os
        
        User = get_user_model()
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        
        if User.objects.filter(username=username).exists():
            results['steps'].append(f'✅ Superuser "{username}" already exists')
        elif all([username, email, password]):
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            results['steps'].append(f'✅ Superuser "{username}" created')
        else:
            results['steps'].append('⚠️  Superuser not created (missing credentials)')
        
        results['status'] = 'success'
        results['message'] = 'Database setup completed successfully!'
        
        return JsonResponse(results)
        
    except Exception as e:
        import traceback
        results['status'] = 'error'
        results['error'] = str(e)
        results['error_type'] = type(e).__name__
        results['traceback'] = traceback.format_exc()
        results['steps'].append(f'❌ Error: {str(e)}')
        return JsonResponse(results, status=500)
