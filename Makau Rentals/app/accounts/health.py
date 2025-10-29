"""
Health Check View - Check database connectivity
"""
from django.http import JsonResponse
from django.db import connection
from django.contrib.auth import get_user_model

def health_check(request):
    """
    Health check endpoint that verifies:
    - Django is running
    - Database connection works
    - Tables exist
    """
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
        
        return JsonResponse({
            'status': 'healthy',
            'database': {
                'connected': True,
                'version': db_version[:50],
                'tables': table_count,
                'users': user_count
            },
            'django': 'running'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e),
            'django': 'running'
        }, status=500)
