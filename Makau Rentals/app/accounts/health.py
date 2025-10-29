"""
Health Check View - Check database connectivity
"""
from django.http import JsonResponse
from django.db import connection
from django.contrib.auth import get_user_model
import os

def health_check(request):
    """
    Health check endpoint that verifies:
    - Django is running
    - Database connection works
    - Tables exist
    """
    response_data = {
        'django': 'running',
        'environment_check': {
            'DATABASE_URL_configured': bool(os.environ.get('DATABASE_URL')),
            'SECRET_KEY_configured': bool(os.environ.get('SECRET_KEY')),
        }
    }
    
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            db_version = cursor.fetchone()[0]
            
            # Count tables
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            table_count = cursor.fetchone()[0]
        
        # Try to query User model
        User = get_user_model()
        user_count = User.objects.count()
        
        response_data['status'] = 'healthy'
        response_data['database'] = {
            'connected': True,
            'version': db_version[:50],
            'tables': table_count,
            'users': user_count
        }
        
        return JsonResponse(response_data)
    except Exception as e:
        response_data['status'] = 'unhealthy'
        response_data['error'] = str(e)
        response_data['error_type'] = type(e).__name__
        
        return JsonResponse(response_data, status=500)
