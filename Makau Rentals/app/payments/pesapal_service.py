"""
PesaPal Payment Integration Service
This module handles all PesaPal payment operations including:
- Authentication
- Payment submission
- IPN (Instant Payment Notification) handling
- Transaction status queries
"""

import requests
import json
import logging
from django.conf import settings
from django.core.cache import cache
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class PesaPalService:
    """
    PesaPal payment service wrapper
    """
    
    def __init__(self):
        # Trim to avoid hidden whitespace/newline issues from .env
        self.consumer_key = (settings.PESAPAL_CONSUMER_KEY or "").strip()
        self.consumer_secret = (settings.PESAPAL_CONSUMER_SECRET or "").strip()
        self.env = getattr(settings, 'PESAPAL_ENV', 'sandbox').strip().lower()

        # Prefer configured base URLs from settings when available
        sandbox_url = getattr(settings, 'PESAPAL_SANDBOX_URL', 'https://cybqa.pesapal.com/pesapalv3')
        live_url = getattr(settings, 'PESAPAL_LIVE_URL', 'https://pay.pesapal.com/v3')

        # Set base URL based on environment
        self.base_url = sandbox_url if self.env == 'sandbox' else live_url

        self.ipn_url = settings.PESAPAL_IPN_URL

        # Log masked diagnostics (never log full secrets)
        try:
            masked_key = self.consumer_key[:4] + "***" + self.consumer_key[-4:] if self.consumer_key else "<missing>"
            logger.info(f"PesaPal configured: env={self.env}, base_url={self.base_url}, key={masked_key}")
        except Exception:
            pass
    
    def get_access_token(self):
        """
        Get PesaPal access token (cached for performance)
        Token is cached for 4 minutes (tokens expire after 5 minutes)
        """
        cache_key = 'pesapal_access_token'
        token = cache.get(cache_key)
        
        if token:
            logger.info("Using cached PesaPal access token")
            return token
        
        try:
            url = f"{self.base_url}/api/Auth/RequestToken"
            
            payload = {
                "consumer_key": self.consumer_key,
                "consumer_secret": self.consumer_secret
            }
            
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            logger.info(f"Requesting PesaPal token from: {url}")
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('token')
                
                if token:
                    # Cache token for 4 minutes (expires after 5)
                    cache.set(cache_key, token, timeout=240)
                    logger.info("PesaPal access token generated and cached")
                    return token
                else:
                    logger.error(f"No token in response: {data}")
                    return None
            else:
                try:
                    err = response.json()
                except Exception:
                    err = response.text
                logger.error(f"PesaPal token request failed: {response.status_code} - {err}")
                return None
                
        except Exception as e:
            logger.error(f"PesaPal token generation error: {str(e)}", exc_info=True)
            return None

    def try_token_on_env(self, env: str):
        """
        Diagnostics: attempt token retrieval on a specific env without caching.
        Returns dict with {ok: bool, status: int, data: any, base_url: str}
        """
        env = (env or 'sandbox').strip().lower()
        base_url = getattr(settings, 'PESAPAL_SANDBOX_URL', 'https://cybqa.pesapal.com/pesapalv3') if env == 'sandbox' else getattr(settings, 'PESAPAL_LIVE_URL', 'https://pay.pesapal.com/v3')
        try:
            url = f"{base_url}/api/Auth/RequestToken"
            payload = {
                "consumer_key": self.consumer_key,
                "consumer_secret": self.consumer_secret
            }
            headers = {"Content-Type": "application/json", "Accept": "application/json"}
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            data = None
            try:
                data = resp.json()
            except Exception:
                data = resp.text
            return {"ok": resp.status_code == 200 and isinstance(data, dict) and bool(data.get('token')), "status": resp.status_code, "data": data, "base_url": base_url}
        except Exception as e:
            return {"ok": False, "status": -1, "data": str(e), "base_url": base_url}
    
    def register_ipn(self):
        """
        Register IPN URL with PesaPal
        Should be called once during setup or when IPN URL changes
        """
        try:
            token = self.get_access_token()
            if not token:
                logger.error("Failed to get access token for IPN registration")
                return None
            
            url = f"{self.base_url}/api/URLSetup/RegisterIPN"
            
            payload = {
                "url": self.ipn_url,
                "ipn_notification_type": "GET"  # or "POST" based on preference
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                ipn_id = data.get('ipn_id')
                logger.info(f"IPN registered successfully: {ipn_id}")
                # Cache IPN ID
                cache.set('pesapal_ipn_id', ipn_id, timeout=None)
                return ipn_id
            else:
                logger.error(f"IPN registration failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"IPN registration error: {str(e)}", exc_info=True)
            return None
    
    def get_ipn_id(self):
        """
        Get registered IPN ID (from cache or register new one)
        """
        ipn_id = cache.get('pesapal_ipn_id')
        
        if not ipn_id:
            ipn_id = self.register_ipn()
        
        return ipn_id
    
    def submit_order(self, amount, description, phone_number, email, 
                     merchant_reference, callback_url=None):
        """
        Submit payment order to PesaPal
        
        Args:
            amount: Payment amount
            description: Payment description
            phone_number: Customer phone number
            email: Customer email
            merchant_reference: Unique reference for this transaction
            callback_url: Optional redirect URL after payment
            
        Returns:
            dict with order_tracking_id and redirect_url, or None on failure
        """
        try:
            token = self.get_access_token()
            if not token:
                logger.error("Failed to get access token for order submission")
                return None
            
            # Get or register IPN
            ipn_id = self.get_ipn_id()
            if not ipn_id:
                logger.error("Failed to get IPN ID for order submission")
                return None
            
            url = f"{self.base_url}/api/Transactions/SubmitOrderRequest"
            
            # Format phone number to international format if provided
            formatted_phone = None
            if phone_number:
                pn = str(phone_number).strip()
                pn = pn.replace('+', '')
                if pn.startswith('0'):
                    formatted_phone = '254' + pn[1:]
                elif pn.startswith('7') or pn.startswith('1'):
                    formatted_phone = '254' + pn
                elif pn.startswith('254'):
                    formatted_phone = pn
                else:
                    # Fallback: leave as-is to avoid blocking payments
                    formatted_phone = pn
            
            payload = {
                "id": merchant_reference,
                "currency": "KES",
                "amount": float(amount),
                "description": description,
                "callback_url": callback_url or self.ipn_url,
                "notification_id": ipn_id,
                "billing_address": {
                    **({"phone_number": formatted_phone} if formatted_phone else {}),
                    **({"email_address": email} if email else {}),
                    "country_code": "KE"
                }
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            logger.info(f"Submitting PesaPal order: {merchant_reference}, Amount: {amount}")
            logger.info(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"PesaPal order submitted: {data}")
                
                return {
                    'order_tracking_id': data.get('order_tracking_id'),
                    'merchant_reference': data.get('merchant_reference'),
                    'redirect_url': data.get('redirect_url'),
                    'status': data.get('status', 'pending')
                }
            else:
                logger.error(f"Order submission failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Order submission error: {str(e)}", exc_info=True)
            return None
    
    def get_transaction_status(self, order_tracking_id):
        """
        Query transaction status from PesaPal
        
        Args:
            order_tracking_id: PesaPal order tracking ID
            
        Returns:
            dict with transaction status details, or None on failure
        """
        try:
            token = self.get_access_token()
            if not token:
                logger.error("Failed to get access token for status check")
                return None
            
            url = f"{self.base_url}/api/Transactions/GetTransactionStatus"
            
            params = {
                "orderTrackingId": order_tracking_id
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Transaction status for {order_tracking_id}: {data}")
                return data
            else:
                logger.error(f"Status check failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Status check error: {str(e)}", exc_info=True)
            return None


# Singleton instance
pesapal_service = PesaPalService()


def validate_payment(phone_number, amount, email=None):
    """
    Validate payment parameters before initiating payment
    """
    try:
        # Validate phone number format
        if not phone_number or not isinstance(phone_number, str):
            return False, "Phone number is required"
        
        # Clean phone number
        phone_number = phone_number.strip().replace(' ', '').replace('+', '')
        
        # Convert to 254 format if needed
        if phone_number.startswith('0') and len(phone_number) == 10:
            phone_number = '254' + phone_number[1:]
        elif phone_number.startswith('7') and len(phone_number) == 9:
            phone_number = '254' + phone_number
        elif phone_number.startswith('1') and len(phone_number) == 9:
            phone_number = '254' + phone_number
        elif phone_number.startswith('254') and len(phone_number) == 12:
            # Already in correct format
            pass
        else:
            return False, "Phone number must be in valid Kenyan format"
        
        # Validate phone number contains only digits
        if not phone_number.isdigit():
            return False, "Phone number must contain only digits"
        
        # Validate email if provided
        if email:
            if '@' not in email or '.' not in email:
                return False, "Invalid email address"
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                return False, "Amount must be greater than 0"
            
            if amount > 500000:  # PesaPal transaction limit
                return False, "Amount exceeds transaction limit (KES 500,000)"
            if amount < 10:  # Minimum amount
                return False, "Amount must be at least KES 10"
        except (ValueError, TypeError):
            return False, "Amount must be a valid number"
        
        return True, phone_number  # Return cleaned phone number
    
    except Exception as e:
        logger.error(f"Payment validation error: {str(e)}")
        return False, "Payment validation failed"
