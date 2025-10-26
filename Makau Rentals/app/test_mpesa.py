#!/usr/bin/env python
import os
import sys
import django
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from payments.generate_token import generate_access_token
from django.conf import settings
import requests
from requests.auth import HTTPBasicAuth

def test_token_generation():
    print("Testing M-Pesa token generation...")
    print(f"Environment: {settings.MPESA_ENV}")
    print(f"Consumer Key: {settings.MPESA_CONSUMER_KEY[:10]}...")
    print(f"Consumer Secret: {settings.MPESA_CONSUMER_SECRET[:10]}...")
    print(f"Shortcode: {settings.MPESA_SHORTCODE}")

    # Test the function
    token = generate_access_token()
    if token:
        print(f"Token generated successfully: {token[:20]}...")
    else:
        print("Token generation failed")

    # Manual test
    print("\nManual token generation test:")
    try:
        if settings.MPESA_ENV == "sandbox":
            url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        else:
            url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

        print(f"URL: {url}")

        response = requests.get(
            url,
            auth=HTTPBasicAuth(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
            timeout=30
        )

        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")

        if response.status_code == 200:
            data = response.json()
            print(f"Manual token: {data.get('access_token')[:20]}...")
        else:
            print("Manual token generation failed")

    except Exception as e:
        print(f"Manual test error: {str(e)}")

if __name__ == "__main__":
    test_token_generation()
