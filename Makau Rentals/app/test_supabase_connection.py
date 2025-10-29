"""
Test Supabase Connection
"""
import psycopg2
from urllib.parse import urlparse
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from app directory
env_path = Path(__file__).parent / 'app' / '.env'
load_dotenv(env_path)

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file!")
    print(f"Looking for .env at: {env_path}")
    exit(1)

print(f"Testing connection to: {DATABASE_URL[:50]}...")

try:
    parsed = urlparse(DATABASE_URL)
    print(f"\nConnection details:")
    print(f"  Host: {parsed.hostname}")
    print(f"  Port: {parsed.port or 5432}")
    print(f"  User: {parsed.username}")
    print(f"  Database: {parsed.path.lstrip('/')}")
    
    print(f"\nAttempting connection...")
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path.lstrip('/'),
        connect_timeout=10
    )
    
    print("✅ CONNECTION SUCCESSFUL!")
    
    # Test query
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"\n📊 PostgreSQL Version: {version[0][:50]}...")
    
    cursor.close()
    conn.close()
    print("\n✅ Connection test passed!")
    
except Exception as e:
    print(f"\n❌ Connection failed: {e}")
    print("\nPossible issues:")
    print("  1. Network/firewall blocking port 5432")
    print("  2. Supabase requires SSL connection")
    print("  3. Password incorrect")
    print("  4. Database not accessible from your network")
