# Test PesaPal Integration
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from payments.pesapal_service import pesapal_service

def test_pesapal_connection():
    """Test PesaPal authentication"""
    print("=" * 60)
    print("TESTING PESAPAL INTEGRATION")
    print("=" * 60)
    
    # Test 1: Get access token (configured env)
    print("\n1. Testing authentication (configured env)...")
    try:
        token = pesapal_service.get_access_token()
        if token:
            print(f"   ✅ Access token generated: {token[:20]}...")
        else:
            print("   ❌ Failed to generate access token (will run diagnostics below)")
    except Exception as e:
        print(f"   ❌ Error: {str(e)} (will run diagnostics below)")
    
    # Test 2: Try both environments directly (diagnostics)
    print("\n2. Diagnostics: Trying both sandbox and live token endpoints...")
    from payments.pesapal_service import pesapal_service as svc
    for env in ["sandbox", "live"]:
        diag = svc.try_token_on_env(env)
        ok = "✅" if diag.get("ok") else "❌"
        print(f"   {ok} env={env} status={diag.get('status')} base_url={diag.get('base_url')}")
        print(f"      response: {diag.get('data')}")

    # Test 3: Register IPN (may be skipped if token failed)
    print("\n3. Testing IPN registration...")
    try:
        ipn_id = pesapal_service.get_ipn_id()
        if ipn_id:
            print(f"   ✅ IPN registered: {ipn_id}")
        else:
            print("   ⚠️  IPN registration returned None (may already be registered)")
    except Exception as e:
        print(f"   ⚠️  IPN error: {str(e)}")
    
    # Test 4: Validate payment parameters
    print("\n4. Testing payment validation...")
    from payments.pesapal_service import validate_payment
    
    test_cases = [
        ("0712345678", 1000, "test@example.com", True),
        ("254712345678", 1000, "test@example.com", True),
        ("+254712345678", 1000, "test@example.com", True),
        ("712345678", 1000, "test@example.com", True),
        ("invalid", 1000, "test@example.com", False),
        ("0712345678", -100, "test@example.com", False),
        ("0712345678", 1000, "invalid", False),
    ]
    
    for phone, amount, email, should_pass in test_cases:
        is_valid, result = validate_payment(phone, amount, email)
        status = "✅" if is_valid == should_pass else "❌"
        print(f"   {status} validate_payment('{phone}', {amount}, '{email}') = {is_valid}")
    
    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start your Django server: python manage.py runserver")
    print("2. Test making a payment through the frontend")
    print("3. Check the logs in logs/payments.log")
    
    return True

if __name__ == "__main__":
    test_pesapal_connection()
