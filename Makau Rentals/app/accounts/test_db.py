"""
Simple database connection test
"""
from django.http import JsonResponse
import os

def test_database(request):
    """Test raw psycopg2 connection"""
    results = {
        'steps': []
    }
    
    try:
        import psycopg2
        from urllib.parse import urlparse
        
        # Get DATABASE_URL
        database_url = os.environ.get('DATABASE_URL', '')
        results['database_url_length'] = len(database_url)
        results['steps'].append(f'DATABASE_URL length: {len(database_url)}')
        
        # Parse it
        parsed = urlparse(database_url)
        results['parsed'] = {
            'scheme': parsed.scheme,
            'hostname': parsed.hostname,
            'port': parsed.port,
            'path': parsed.path,
            'username': parsed.username,
            'has_password': bool(parsed.password),
            'password_length': len(parsed.password) if parsed.password else 0,
            'query': parsed.query,
        }
        
        results['steps'].append('Attempting raw psycopg2 connection...')
        
        # Try to connect using psycopg2 directly
        try:
            conn = psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                database=parsed.path.lstrip('/'),
                user=parsed.username,
                password=parsed.password,
                sslmode='require',
                connect_timeout=10
            )
            
            results['steps'].append('✅ Raw psycopg2 connection successful!')
            
            # Test query
            cursor = conn.cursor()
            cursor.execute('SELECT version();')
            version = cursor.fetchone()[0]
            results['postgresql_version'] = version
            cursor.close()
            conn.close()
            
            results['steps'].append('✅ Query executed successfully!')
            results['status'] = 'success'
            
        except Exception as psycopg2_error:
            results['steps'].append(f'❌ psycopg2 connection failed')
            results['psycopg2_error'] = str(psycopg2_error)
            results['psycopg2_error_type'] = type(psycopg2_error).__name__
            
            # Try to get more details
            if hasattr(psycopg2_error, 'pgerror'):
                results['pgerror'] = str(psycopg2_error.pgerror)
            if hasattr(psycopg2_error, 'pgcode'):
                results['pgcode'] = str(psycopg2_error.pgcode)
                
            results['status'] = 'error'
        
        return JsonResponse(results)
        
    except Exception as e:
        import traceback
        results['status'] = 'error'
        results['error'] = str(e)
        results['traceback'] = traceback.format_exc()
        return JsonResponse(results, status=500)
