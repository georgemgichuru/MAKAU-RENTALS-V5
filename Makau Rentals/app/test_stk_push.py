#!/usr/bin/env python
import os
import sys
import django
from pathlib import Path
import base64
from datetime import datetime

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from payments.generate_token import generate_access_token
from django.conf import settings

import requests

def test_stk_push():
    print("Testing M-Pesa STK push...")

    # Get token
    token = generate_access_token()
    if not token:
        print("Failed to get access token")
        return

    print(f"Got access token: {token[:20]}...")

    # Generate password like in the code
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password_string = settings.MPESA_SHORTCODE + settings.MPESA_PASSKEY + timestamp
    password = base64.b64encode(password_string.encode('utf-8')).decode('utf-8')

    print(f"Timestamp: {timestamp}")
    print(f"Password string: {settings.MPESA_SHORTCODE} + [PASSKEY] + {timestamp}")
    print(f"Generated password: {password}")

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": 1,  # Test with 1 KES
        "PartyA": "254712345678",  # Test phone number
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": "254712345678",
        "CallBackURL": settings.MPESA_DEPOSIT_CALLBACK_URL,
        "AccountReference": "TEST-STK-PUSH",
        "TransactionDesc": "Test STK push"
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Use correct URL
    if settings.MPESA_ENV == "sandbox":
        url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    else:
        url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

    print(f"STK Push URL: {url}")
    print(f"Payload: {payload}")

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")

        if response.status_code == 200:
            data = response.json()
            print(f"Response data: {data}")
            if data.get("ResponseCode") == "0":
                print("STK push successful!")
            else:
                print(f"STK push failed: {data.get('ResponseDescription', 'Unknown error')}")
        else:
            print("STK push request failed")

    except Exception as e:
        print(f"STK push error: {str(e)}")

if __name__ == "__main__":
    test_stk_push()
