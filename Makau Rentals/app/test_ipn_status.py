"""
Test script to check/register PesaPal IPN
Run this to verify your IPN registration
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from payments.pesapal_service import pesapal_service
from django.core.cache import cache

def main():
    print("=" * 60)
    print("PesaPal IPN Status Check")
    print("=" * 60)
    
    # Check cached IPN ID
    cached_ipn = cache.get('pesapal_ipn_id')
    if cached_ipn:
        print(f"\n✅ IPN ID (from cache): {cached_ipn}")
    else:
        print("\n⚠️  No IPN ID found in cache")
    
    # Get IPN ID (will register if not exists)
    print("\n🔄 Getting/Registering IPN...")
    ipn_id = pesapal_service.get_ipn_id()
    
    if ipn_id:
        print(f"\n✅ SUCCESS! IPN ID: {ipn_id}")
        print(f"\n📍 Your IPN URL:")
        print(f"   {pesapal_service.ipn_url}")
        print(f"\n💡 This is what PesaPal will use to notify your backend")
        print(f"   about payment status changes.")
    else:
        print("\n❌ FAILED to get/register IPN")
        print("   Check your credentials and network connection")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
