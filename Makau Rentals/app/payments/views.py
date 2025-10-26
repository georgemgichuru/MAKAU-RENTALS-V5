from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Sum, Q
from django.http import HttpResponse
import json
import requests
from decimal import Decimal
from datetime import datetime, timedelta
import csv
import io
import uuid
import base64
import logging

from accounts.models import Unit, UnitType, Property, Subscription
from .models import Payment, SubscriptionPayment
from .generate_token import generate_access_token
from .serializers import PaymentSerializer, SubscriptionPaymentSerializer

logger = logging.getLogger(__name__)

def validate_mpesa_payment(phone_number, amount):
    """
    Validate payment parameters before initiating STK push
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
        elif phone_number.startswith('254') and len(phone_number) == 12:
            # Already in correct format
            pass
        else:
            return False, "Phone number must be in format 254XXXXXXXXX"
        
        # Validate phone number contains only digits
        if not phone_number.isdigit():
            return False, "Phone number must contain only digits"
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                return False, "Amount must be greater than 0"
            
            if amount > 150000:  # M-Pesa transaction limit
                return False, "Amount exceeds M-Pesa transaction limit (KES 150,000)"
            if amount < 1:  # Minimum amount
                return False, "Amount must be at least KES 1"
        except (ValueError, TypeError):
            return False, "Amount must be a valid number"
        
        return True, phone_number  # Return cleaned phone number
    
    except Exception as e:
        logger.error(f"Payment validation error: {str(e)}")
        return False, "Payment validation failed"
# ------------------------------
# M-PESA STK PUSH FUNCTIONS
# ------------------------------
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stk_push(request, unit_id):
    """
    Initiate REAL STK push for rent payment
    """
    try:
        unit = get_object_or_404(Unit, id=unit_id)
        tenant = request.user

        # Validate tenant owns the unit AND user is a tenant
        if request.user.user_type != 'tenant':
            return Response({"error": "Only tenants can make rent payments"}, status=status.HTTP_403_FORBIDDEN)
        # Validate tenant owns the unit
        if unit.tenant != tenant:
            return Response({"error": "You don't have permission to pay for this unit"}, status=status.HTTP_403_FORBIDDEN)

        # Check if rent is already paid
        if unit.rent_remaining <= 0:
            return Response({"error": "Rent is already paid for this unit"}, status=status.HTTP_400_BAD_REQUEST)

        amount = unit.rent_remaining
        phone_number = tenant.phone_number

        if not phone_number:
            return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ ADD VALIDATION HERE
        is_valid, validation_result = validate_mpesa_payment(phone_number, amount)
        if not is_valid:
            return Response({"error": validation_result}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use cleaned phone number
        phone_number = validation_result

        # Generate access token
        access_token = generate_access_token()
        if not access_token:
            return Response({"error": "Failed to generate M-Pesa access token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Prepare STK push request - FIXED PASSWORD GENERATION
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = settings.MPESA_SHORTCODE + settings.MPESA_PASSKEY + timestamp
        password = base64.b64encode(password_string.encode('utf-8')).decode('utf-8')

        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": settings.MPESA_RENT_CALLBACK_URL,
            "AccountReference": f"RENT-{unit.unit_code}",
            "TransactionDesc": f"Rent payment for {unit.unit_number}"
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Use correct URL based on environment
        if settings.MPESA_ENV == "sandbox":
            url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        else:
            url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

        logger.info(f"Sending STK push to: {url}")
        logger.info(f"Payload: {payload}")

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response_data = response.json()

        logger.info(f"STK push response: {response_data}")

        if response.status_code == 200 and response_data.get("ResponseCode") == "0":
            # Create pending payment record
            payment = Payment.objects.create(
                tenant=tenant,
                unit=unit,
                amount=amount,
                status="Pending",
                payment_type="rent",
                mpesa_checkout_request_id=response_data["CheckoutRequestID"]
            )

            # Cache checkout request ID for callback
            cache_key = f"stk_{response_data['CheckoutRequestID']}"
            cache_data = {
                "payment_id": payment.id,
                "unit_id": unit.id,
                "amount": float(amount),
                "tenant_id": tenant.id
            }
            cache.set(cache_key, cache_data, timeout=300)  # 5 minutes

            logger.info(f"STK push initiated successfully. Payment ID: {payment.id}, Cache Key: {cache_key}")

            return Response({
                "success": True,
                "message": "STK push initiated successfully",
                "checkout_request_id": response_data["CheckoutRequestID"],
                "payment_id": payment.id
            })

        else:
            error_message = response_data.get('errorMessage', response_data.get('ResponseDescription', 'Unknown error'))
            logger.error(f"STK push failed: {error_message}")
            return Response({
                "error": "Failed to initiate STK push",
                "details": error_message,
                "response_data": response_data
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"STK push error: {str(e)}", exc_info=True)
        return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stk_push_subscription(request):
    """
    Initiate STK push for subscription payment
    """
    try:
        user = request.user
        plan = request.data.get('plan')
        phone_number = request.data.get('phone_number')

        if not plan or not phone_number:
            return Response({"error": "Plan and phone number are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate plan and get amount
        plan_amounts = {
            'starter': 2000,        # tier1: 1-10 units
            'basic': 2500,          # tier2: 11-20 units  
            'professional': 4500,   # tier3/tier4: 21-100 units
            'onetime': 40000        # Lifetime access
        }

        if plan not in plan_amounts:
            return Response({
                "error": f"Invalid plan '{plan}'. Valid plans are: {', '.join(plan_amounts.keys())}"
            }, status=status.HTTP_400_BAD_REQUEST)

        amount = plan_amounts[plan]

        # ✅ ADD VALIDATION HERE
        is_valid, validation_result = validate_mpesa_payment(phone_number, amount)
        if not is_valid:
            return Response({"error": validation_result}, status=status.HTTP_400_BAD_REQUEST)
        
        phone_number = validation_result

        # Generate access token
        access_token = generate_access_token()
        if not access_token:
            return Response({"error": "Failed to generate M-Pesa access token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Prepare STK push request - FIXED PASSWORD
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = settings.MPESA_SHORTCODE + settings.MPESA_PASSKEY + timestamp
        password = base64.b64encode(password_string.encode('utf-8')).decode('utf-8')

        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": settings.MPESA_SUBSCRIPTION_CALLBACK_URL,
            "AccountReference": f"SUB-{user.id}",
            "TransactionDesc": f"Subscription payment for {plan} plan"
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Make STK push request
        if settings.MPESA_ENV == "sandbox":
            url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        else:
            url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response_data = response.json()

        if response.status_code == 200 and response_data.get("ResponseCode") == "0":
            # Create pending subscription payment record
            subscription_payment = SubscriptionPayment.objects.create(
                user=user,
                amount=Decimal(amount),
                subscription_type=plan,
                status="Pending",
                mpesa_checkout_request_id=response_data["CheckoutRequestID"]
            )

            # Cache checkout request ID for callback
            cache_key = f"stk_sub_{response_data['CheckoutRequestID']}"
            cache.set(cache_key, {
                "subscription_payment_id": subscription_payment.id,
                "user_id": user.id,
                "plan": plan,
                "amount": amount
            }, timeout=300)  # 5 minutes

            return Response({
                "success": True,
                "message": "Subscription STK push initiated successfully",
                "checkout_request_id": response_data["CheckoutRequestID"],
                "subscription_payment_id": subscription_payment.id
            })

        else:
            error_message = response_data.get('errorMessage', response_data.get('ResponseDescription', 'Unknown error'))
            return Response({
                "error": "Failed to initiate subscription STK push",
                "details": error_message
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Subscription STK push error: {str(e)}", exc_info=True)
        return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ------------------------------
# M-PESA CALLBACK FUNCTIONS (FIXED VERSIONS)
# ------------------------------
@csrf_exempt
def mpesa_rent_callback(request):
    """
    Enhanced rent payment callback handler
    """
    try:
        callback_data = json.loads(request.body)
        logger.info(f"Rent callback received: {callback_data}")

        stk_callback = callback_data.get("Body", {}).get("stkCallback", {})
        result_code = stk_callback.get("ResultCode")
        result_desc = stk_callback.get("ResultDesc", "")
        checkout_request_id = stk_callback.get("CheckoutRequestID")

        logger.info(f"Rent callback - ResultCode: {result_code}, CheckoutRequestID: {checkout_request_id}")

        if result_code == 0:
            # Payment successful
            callback_metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
            
            # Extract payment details
            mpesa_receipt = None
            amount = None
            phone_number = None

            for item in callback_metadata:
                if item.get("Name") == "MpesaReceiptNumber":
                    mpesa_receipt = item.get("Value")
                elif item.get("Name") == "Amount":
                    amount = item.get("Value")
                elif item.get("Name") == "PhoneNumber":
                    phone_number = item.get("Value")

            # Get cached payment data
            cached_data = cache.get(f"stk_{checkout_request_id}") if checkout_request_id else None
            
            if cached_data:
                try:
                    payment = Payment.objects.get(id=cached_data["payment_id"])
                    unit = payment.unit
                    
                    # Update payment record
                    payment.status = "Success"
                    payment.mpesa_receipt = mpesa_receipt or f"RENT-{payment.id}-{uuid.uuid4().hex[:8].upper()}"
                    
                    if amount:
                        payment.amount = Decimal(amount)
                    
                    payment.save()

                    # Update unit rent_paid
                    paid_amount = Decimal(amount) if amount else payment.amount
                    unit.rent_paid += paid_amount
                    unit.rent_remaining = unit.rent - unit.rent_paid
                    unit.save()

                    logger.info(f"Rent payment {payment.id} completed successfully for unit {unit.unit_number}")
                    logger.info(f"Unit {unit.unit_number} rent paid: {unit.rent_paid}, remaining: {unit.rent_remaining}")
                    
                    # Clear cache
                    cache.delete(f"stk_{checkout_request_id}")

                except Payment.DoesNotExist:
                    logger.error(f"Rent payment not found for ID: {cached_data['payment_id']}")
                except Unit.DoesNotExist:
                    logger.error(f"Unit not found for rent payment: {cached_data['payment_id']}")
                except Exception as e:
                    logger.error(f"Error processing rent callback: {str(e)}")

            else:
                logger.warning(f"No cached data found for rent checkout: {checkout_request_id}")

        else:
            # Payment failed
            logger.error(f"Rent payment failed - ResultCode: {result_code}, Description: {result_desc}")
            
            # Update payment status to failed
            if checkout_request_id:
                cached_data = cache.get(f"stk_{checkout_request_id}")
                if cached_data:
                    try:
                        payment = Payment.objects.get(id=cached_data["payment_id"])
                        payment.status = "Failed"
                        payment.failure_reason = result_desc
                        payment.save()
                        logger.info(f"Rent payment {payment.id} marked as failed: {result_desc}")
                    except Payment.DoesNotExist:
                        logger.error(f"Rent payment not found for failed callback: {cached_data['payment_id']}")

        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})

    except json.JSONDecodeError:
        logger.error("Invalid JSON in rent callback")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid JSON"})
    except Exception as e:
        logger.error(f"Unexpected error in rent callback: {str(e)}")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Internal error"})

@csrf_exempt
def mpesa_deposit_callback(request):
    """
    Enhanced deposit payment callback handler with registration support
    """
    try:
        callback_data = json.loads(request.body)
        logger.info(f"Deposit callback received: {callback_data}")

        stk_callback = callback_data.get("Body", {}).get("stkCallback", {})
        result_code = stk_callback.get("ResultCode")
        result_desc = stk_callback.get("ResultDesc", "")
        checkout_request_id = stk_callback.get("CheckoutRequestID")

        logger.info(f"Deposit callback - ResultCode: {result_code}, CheckoutRequestID: {checkout_request_id}")

        if result_code == 0:
            # Payment successful
            callback_metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])

            # Extract payment details
            mpesa_receipt = None
            amount = None
            phone_number = None

            for item in callback_metadata:
                if item.get("Name") == "MpesaReceiptNumber":
                    mpesa_receipt = item.get("Value")
                elif item.get("Name") == "Amount":
                    amount = item.get("Value")
                elif item.get("Name") == "PhoneNumber":
                    phone_number = item.get("Value")

            # Check both regular and registration cache keys
            cached_data = cache.get(f"stk_deposit_{checkout_request_id}")
            is_registration = False

            if not cached_data:
                cached_data = cache.get(f"stk_deposit_reg_{checkout_request_id}")
                is_registration = True

            if cached_data:
                try:
                    payment = Payment.objects.get(id=cached_data["payment_id"])
                    unit = payment.unit

                    # Update payment record
                    payment.status = "completed"
                    payment.mpesa_receipt = mpesa_receipt or f"DEP-{payment.id}-{uuid.uuid4().hex[:8].upper()}"

                    if amount:
                        payment.amount = Decimal(amount)

                    payment.save()

                    # For registration payments, reserve the unit
                    # The tenant will be linked during registration completion
                    if is_registration:
                        unit.is_available = False  # Reserve the unit
                        unit.save()
                        logger.info(f"Unit {unit.unit_number} reserved via registration deposit payment")
                    else:
                        # Regular deposit payment - assign tenant if available
                        if payment.tenant:
                            unit.is_available = False
                            unit.tenant = payment.tenant
                            unit.assigned_date = timezone.now()
                            unit.save()

                    logger.info(f"Deposit payment {payment.id} completed successfully for unit {unit.unit_number}")

                    # Clear cache
                    cache_key = f"stk_deposit_reg_{checkout_request_id}" if is_registration else f"stk_deposit_{checkout_request_id}"
                    cache.delete(cache_key)

                except Payment.DoesNotExist:
                    logger.error(f"Deposit payment not found for ID: {cached_data['payment_id']}")
                except Unit.DoesNotExist:
                    logger.error(f"Unit not found for deposit payment: {cached_data['payment_id']}")
                except Exception as e:
                    logger.error(f"Error processing deposit callback: {str(e)}")

            else:
                logger.warning(f"No cached data found for deposit checkout: {checkout_request_id}")

        else:
            # Payment failed
            logger.error(f"Deposit payment failed - ResultCode: {result_code}, Description: {result_desc}")

            # Update payment status to failed
            if checkout_request_id:
                cached_data = cache.get(f"stk_deposit_{checkout_request_id}") or cache.get(f"stk_deposit_reg_{checkout_request_id}")
                if cached_data:
                    try:
                        payment = Payment.objects.get(id=cached_data["payment_id"])
                        payment.status = "failed"
                        payment.failure_reason = result_desc
                        payment.save()
                        logger.info(f"Deposit payment {payment.id} marked as failed: {result_desc}")
                    except Payment.DoesNotExist:
                        logger.error(f"Deposit payment not found for failed callback: {cached_data['payment_id']}")

        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})

    except json.JSONDecodeError:
        logger.error("Invalid JSON in deposit callback")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid JSON"})
    except Exception as e:
        logger.error(f"Unexpected error in deposit callback: {str(e)}")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Internal error"})

@csrf_exempt
def mpesa_subscription_callback(request):
    """
    Enhanced subscription payment callback handler
    """
    try:
        callback_data = json.loads(request.body)
        logger.info(f"Subscription callback received: {callback_data}")

        stk_callback = callback_data.get("Body", {}).get("stkCallback", {})
        result_code = stk_callback.get("ResultCode")
        result_desc = stk_callback.get("ResultDesc", "")
        checkout_request_id = stk_callback.get("CheckoutRequestID")

        logger.info(f"Subscription callback - ResultCode: {result_code}, CheckoutRequestID: {checkout_request_id}")

        if result_code == 0:
            # Payment successful
            callback_metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
            
            # Extract payment details
            mpesa_receipt = None
            amount = None
            phone_number = None

            for item in callback_metadata:
                if item.get("Name") == "MpesaReceiptNumber":
                    mpesa_receipt = item.get("Value")
                elif item.get("Name") == "Amount":
                    amount = item.get("Value")
                elif item.get("Name") == "PhoneNumber":
                    phone_number = item.get("Value")

            # Get cached subscription payment data
            cached_data = cache.get(f"stk_sub_{checkout_request_id}") if checkout_request_id else None
            
            if cached_data:
                try:
                    subscription_payment = SubscriptionPayment.objects.get(
                        id=cached_data["subscription_payment_id"]
                    )
                    user = subscription_payment.user
                    
                    # Update subscription payment record
                    subscription_payment.status = "Success"
                    subscription_payment.mpesa_receipt_number = (
                        mpesa_receipt or 
                        f"SUB-{subscription_payment.id}-{uuid.uuid4().hex[:8].upper()}"
                    )
                    
                    if amount:
                        subscription_payment.amount = Decimal(amount)
                    
                    subscription_payment.save()

                    # Update or create user subscription
                    subscription, created = Subscription.objects.get_or_create(
                        user=user,
                        defaults={
                            'plan': subscription_payment.subscription_type,
                            'expiry_date': timezone.now() + timedelta(days=30)
                        }
                    )
                    
                    if not created:
                        # Update existing subscription
                        subscription.plan = subscription_payment.subscription_type
                        subscription.expiry_date = timezone.now() + timedelta(days=30)
                        subscription.save()

                    logger.info(f"Subscription payment {subscription_payment.id} completed successfully")
                    logger.info(f"User {user.email} subscription updated to {subscription_payment.subscription_type}")
                    
                    # Clear cache
                    cache.delete(f"stk_sub_{checkout_request_id}")

                except SubscriptionPayment.DoesNotExist:
                    logger.error(f"Subscription payment not found for ID: {cached_data['subscription_payment_id']}")
                except Exception as e:
                    logger.error(f"Error processing subscription callback: {str(e)}")

            else:
                logger.warning(f"No cached data found for subscription checkout: {checkout_request_id}")

        else:
            # Payment failed
            logger.error(f"Subscription payment failed - ResultCode: {result_code}, Description: {result_desc}")
            
            # Update payment status to failed
            if checkout_request_id:
                cached_data = cache.get(f"stk_sub_{checkout_request_id}")
                if cached_data:
                    try:
                        subscription_payment = SubscriptionPayment.objects.get(
                            id=cached_data["subscription_payment_id"]
                        )
                        subscription_payment.status = "Failed"
                        subscription_payment.failure_reason = result_desc
                        subscription_payment.save()
                        logger.info(f"Subscription payment {subscription_payment.id} marked as failed: {result_desc}")
                    except SubscriptionPayment.DoesNotExist:
                        logger.error(f"Subscription payment not found for failed callback: {cached_data['subscription_payment_id']}")

        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})

    except json.JSONDecodeError:
        logger.error("Invalid JSON in subscription callback")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid JSON"})
    except Exception as e:
        logger.error(f"Unexpected error in subscription callback: {str(e)}")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Internal error"})
    
class InitiateDepositPaymentRegistrationView(APIView):
    """
    Initiate deposit payment during tenant registration (no auth required)
    """
    permission_classes = []  # No authentication required

    def post(self, request):
        try:
            unit_id = request.data.get('unit_id')
            phone_number = request.data.get('phone_number')
            session_id = request.data.get('session_id')
            amount = request.data.get('amount')  # ✅ GET AMOUNT FROM FRONTEND

            logger.info(f"Registration deposit STK push request: unit_id={unit_id}, phone={phone_number}, amount={amount}")

            # Parse unit_id as integer
            try:
                unit_id = int(unit_id)
            except (ValueError, TypeError):
                return Response({"error": "Unit ID must be a valid integer"}, status=status.HTTP_400_BAD_REQUEST)

            if not phone_number:
                return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)

            unit = get_object_or_404(Unit, id=unit_id)

            if not unit.is_available:
                return Response({"error": "Unit is not available"}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ USE AMOUNT FROM FRONTEND, FALLBACK TO UNIT DEPOSIT OR RENT
            if amount:
                try:
                    amount = float(amount)
                except (ValueError, TypeError):
                    return Response({"error": "Invalid amount format"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Fallback: use deposit if set, otherwise use rent
                amount = float(unit.deposit) if unit.deposit and float(unit.deposit) > 0 else float(unit.rent)

            # ✅ VALIDATE AMOUNT BEFORE PROCEEDING
            if amount <= 0:
                logger.error(f"Invalid amount for unit {unit.id}: {amount}")
                return Response({"error": "Deposit amount must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

            logger.info(f"Processing deposit payment: amount={amount}, unit={unit.unit_number}")

            # Validate phone number
            is_valid, validation_result = validate_mpesa_payment(phone_number, amount)
            if not is_valid:
                logger.error(f"Phone validation failed: {validation_result}")
                return Response({"error": validation_result}, status=status.HTTP_400_BAD_REQUEST)

            phone_number = validation_result

            # Generate access token
            access_token = generate_access_token()
            if not access_token:
                logger.error("Failed to generate M-Pesa access token")
                return Response({"error": "Failed to generate M-Pesa access token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            logger.info(f"Access token generated successfully: {access_token[:20]}...")

            # Prepare STK push request
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password_string = settings.MPESA_SHORTCODE + settings.MPESA_PASSKEY + timestamp
            password = base64.b64encode(password_string.encode('utf-8')).decode('utf-8')

            payload = {
                "BusinessShortCode": settings.MPESA_SHORTCODE,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),  # ✅ ENSURE IT'S AN INTEGER
                "PartyA": phone_number,
                "PartyB": settings.MPESA_SHORTCODE,
                "PhoneNumber": phone_number,
                "CallBackURL": settings.MPESA_DEPOSIT_CALLBACK_URL,
                "AccountReference": f"DEPOSIT-REG-{unit.unit_code}",
                "TransactionDesc": f"Deposit payment for {unit.unit_number}"
            }

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }

            # Use correct URL
            if settings.MPESA_ENV == "sandbox":
                url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
            else:
                url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

            logger.info(f"Sending STK push request to: {url}")
            logger.info(f"Payload: {payload}")

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response_data = response.json()

            logger.info(f"M-Pesa response: Status={response.status_code}, Data={response_data}")

            if response.status_code == 200 and response_data.get("ResponseCode") == "0":
                # ✅ FIX: Create payment without tenant (will be linked later during registration)
                payment = Payment.objects.create(
                    unit=unit,
                    amount=amount,
                    status="pending",
                    payment_type="deposit",
                    mpesa_checkout_request_id=response_data["CheckoutRequestID"],
                    # tenant is NULL for registration payments - this is OK now
                )

                # Cache checkout request ID for callback with registration data
                cache_key = f"stk_deposit_reg_{response_data['CheckoutRequestID']}"
                cache_data = {
                    "payment_id": payment.id,
                    "unit_id": unit.id,
                    "amount": float(amount),
                    "phone_number": phone_number,
                    "session_id": session_id  # Link to registration session
                }
                cache.set(cache_key, cache_data, timeout=300)  # 5 minutes

                logger.info(f"✅ Registration deposit STK push initiated successfully: payment_id={payment.id}, checkout_id={response_data['CheckoutRequestID']}")

                return Response({
                    "success": True,
                    "message": "Deposit STK push initiated successfully",
                    "checkout_request_id": response_data["CheckoutRequestID"],
                    "payment_id": payment.id
                })

            else:
                error_message = response_data.get('errorMessage', response_data.get('ResponseDescription', 'Unknown error'))
                logger.error(f"Registration deposit STK push failed: {error_message}")
                logger.error(f"Full response: {response_data}")
                return Response({
                    "error": "Failed to initiate deposit STK push",
                    "details": error_message
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"❌ Registration deposit payment error: {str(e)}", exc_info=True)
            return Response({"error": "Internal server error", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class InitiateDepositPaymentView(APIView):
    """
    Initiate REAL deposit payment for unit
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        unit_id = request.data.get('unit_id')
        unit = get_object_or_404(Unit, id=unit_id)

        if not unit.is_available:
            return Response({"error": "Unit is not available"}, status=status.HTTP_400_BAD_REQUEST)

        tenant = request.user
        amount = unit.deposit
        phone_number = tenant.phone_number

        if not phone_number:
            return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ ADD VALIDATION HERE
        is_valid, validation_result = validate_mpesa_payment(phone_number, amount)
        if not is_valid:
            return Response({"error": validation_result}, status=status.HTTP_400_BAD_REQUEST)

        phone_number = validation_result

        # Generate access token
        access_token = generate_access_token()
        if not access_token:
            return Response({"error": "Failed to generate M-Pesa access token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Prepare STK push request - FIXED PASSWORD GENERATION
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = settings.MPESA_SHORTCODE + settings.MPESA_PASSKEY + timestamp
        password = base64.b64encode(password_string.encode('utf-8')).decode('utf-8')

        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": settings.MPESA_DEPOSIT_CALLBACK_URL,
            "AccountReference": f"DEPOSIT-{unit.unit_code}",
            "TransactionDesc": f"Deposit payment for {unit.unit_number}"
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Use correct URL
        if settings.MPESA_ENV == "sandbox":
            url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        else:
            url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response_data = response.json()

        if response.status_code == 200 and response_data.get("ResponseCode") == "0":
            # Create pending deposit payment record
            payment = Payment.objects.create(
                tenant=tenant,
                unit=unit,
                amount=amount,
                status="Pending",
                payment_type="deposit",
                mpesa_checkout_request_id=response_data["CheckoutRequestID"]
            )

            # Cache checkout request ID for callback
            cache.set(f"stk_deposit_{response_data['CheckoutRequestID']}", {
                "payment_id": payment.id,
                "unit_id": unit.id,
                "amount": float(amount),
                "tenant_id": tenant.id
            }, timeout=300)  # 5 minutes

            logger.info(f"Deposit STK push initiated for payment {payment.id}, amount {amount}")

            return Response({
                "success": True,
                "message": "Deposit STK push initiated successfully",
                "checkout_request_id": response_data["CheckoutRequestID"],
                "payment_id": payment.id
            })

        else:
            error_message = response_data.get('errorMessage', response_data.get('ResponseDescription', 'Unknown error'))
            logger.error(f"Deposit STK push failed: {error_message}")
            return Response({
                "error": "Failed to initiate deposit STK push",
                "details": error_message
            }, status=status.HTTP_400_BAD_REQUEST)
@csrf_exempt
def mpesa_b2c_callback(request):
    """
    Handle M-Pesa B2C payment callback
    """
    try:
        callback_data = json.loads(request.body)
        logger.info(f"B2C callback received: {callback_data}")

        result = callback_data.get("Result", {})

        if result.get("ResultCode") == 0:
            # Successful B2C payment
            result_parameters = result.get("ResultParameters", {}).get("ResultParameter", [])

            transaction_receipt = None
            transaction_amount = None
            conversation_id = result.get("ConversationID")

            # Extract relevant parameters
            for param in result_parameters:
                if param["Key"] == "TransactionReceipt":
                    transaction_receipt = param["Value"]
                elif param["Key"] == "TransactionAmount":
                    transaction_amount = param["Value"]

            # Get cached B2C payment data if exists
            cached_data = cache.get(f"b2c_{conversation_id}")
            if cached_data:
                # Update payment status or perform business logic here
                # For example, mark disbursement as successful
                logger.info(f"B2C payment successful: Receipt {transaction_receipt}, Amount {transaction_amount}")
                cache.delete(f"b2c_{conversation_id}")
            else:
                logger.info(f"B2C payment successful (no cached data): Receipt {transaction_receipt}, Amount {transaction_amount}")

        else:
            # Failed B2C payment
            logger.error(f"B2C payment failed: {result.get('ResultDesc')}")

        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})

    except Exception as e:
        logger.error(f"B2C callback error: {str(e)}")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Error"})
class DepositPaymentStatusView(APIView):
    """
    Check deposit payment status - FIXED VERSION
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = Payment.objects.get(id=payment_id)
            
            # Check if user has permission to view this payment
            if request.user.user_type == 'tenant' and payment.tenant != request.user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            if request.user.user_type == 'landlord' and payment.unit.property_obj.landlord != request.user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            return Response({
                "payment_id": payment.id,
                "status": payment.status,
                "amount": float(payment.amount),
                "mpesa_receipt": payment.mpesa_receipt_number if hasattr(payment, 'mpesa_receipt_number') else payment.mpesa_receipt
            })
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)
# ------------------------------
# DRF CLASS-BASED VIEWS
# ------------------------------

class PaymentListCreateView(generics.ListCreateAPIView):
    """
    List and create rent payments
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'tenant':
            return Payment.objects.filter(tenant=user)
        elif user.user_type == 'landlord':
            # Landlords can see payments for their properties
            return Payment.objects.filter(unit__property_obj__landlord=user)
        return Payment.objects.none()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)


class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, and delete rent payment
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'tenant':
            return Payment.objects.filter(tenant=user)
        elif user.user_type == 'landlord':
            return Payment.objects.filter(unit__property_obj__landlord=user)
        return Payment.objects.none()


class SubscriptionPaymentListCreateView(generics.ListCreateAPIView):
    """
    List and create subscription payments
    """
    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SubscriptionPayment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubscriptionPaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, and delete subscription payment
    """
    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SubscriptionPayment.objects.filter(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve to return payment status for polling
        """
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            # Add additional status information
            response_data = serializer.data
            response_data['status'] = instance.status
            response_data['is_complete'] = instance.status in ['Success', 'Failed']
            
            return Response(response_data)
        except Exception as e:
            logger.error(f"Error retrieving subscription payment: {str(e)}")
            return Response(
                {"error": "Failed to retrieve payment status"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RentSummaryView(APIView):
    """
    Get rent summary for landlord
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.user_type != 'landlord':
            return Response({"error": "Only landlords can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)

        # Calculate total collected and outstanding rent
        properties = Property.objects.filter(landlord=user)
        units = Unit.objects.filter(property_obj__in=properties)

        total_collected = Payment.objects.filter(
            unit__in=units,
            status='Success'
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_outstanding = units.aggregate(
            outstanding=Sum('rent_remaining')
        )['outstanding'] or 0

        return Response({
            "total_collected": total_collected,
            "total_outstanding": total_outstanding,
            "properties_count": properties.count(),
            "units_count": units.count()
        })


class UnitTypeListView(generics.ListAPIView):
    """
    List unit types for landlord
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UnitType.objects.filter(landlord=self.request.user)





class CleanupPendingPaymentsView(APIView):
    """
    Clean up old pending payments - ENHANCED VERSION
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delete pending payments older than 1 hour
        cutoff_time = timezone.now() - timedelta(hours=1)
        
        # Clean up rent payments
        rent_deleted_count = Payment.objects.filter(
            status='Pending',
            created_at__lt=cutoff_time
        ).delete()

        # Clean up subscription payments  
        subscription_deleted_count = SubscriptionPayment.objects.filter(
            status='Pending',
            transaction_date__lt=cutoff_time
        ).delete()

        total_deleted = rent_deleted_count[0] + subscription_deleted_count[0]

        return Response({"message": f"Cleaned up {total_deleted} pending payments"})


# ------------------------------
# CSV EXPORT VIEWS
# ------------------------------

class LandLordCSVView(APIView):
    """
    Export landlord payment data as CSV
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, property_id):
        user = request.user
        if user.user_type != 'landlord':
            return Response({"error": "Only landlords can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)

        property_obj = get_object_or_404(Property, id=property_id, landlord=user)
        units = Unit.objects.filter(property_obj=property_obj)
        payments = Payment.objects.filter(unit__in=units, status='completed')

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="landlord_payments_{property_obj.name}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Unit Number', 'Tenant', 'Amount', 'Date', 'M-Pesa Receipt'])

        for payment in payments:
            writer.writerow([
                payment.unit.unit_number,
                payment.tenant.full_name if payment.tenant else '',
                payment.amount,
                payment.created_at.strftime('%Y-%m-%d'),
                payment.mpesa_receipt or ''
            ])

        return response


class TenantCSVView(APIView):
    """
    Export tenant payment data as CSV
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, unit_id):
        user = request.user
        unit = get_object_or_404(Unit, id=unit_id)

        if user.user_type == 'tenant' and unit.tenant != user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        if user.user_type == 'landlord' and unit.property_obj.landlord != user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        payments = Payment.objects.filter(unit=unit, status='completed')

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="tenant_payments_unit_{unit.unit_number}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Amount', 'Date', 'M-Pesa Receipt', 'Type'])

        for payment in payments:
            writer.writerow([
                payment.amount,
                payment.created_at.strftime('%Y-%m-%d'),
                payment.mpesa_receipt or '',
                payment.payment_type
            ])

        return response


class RentPaymentsCSVView(APIView):
    """
    Export all rent payments data as CSV for landlord
    Supports optional property_id filter via query parameter
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.user_type != 'landlord':
            return Response({"error": "Only landlords can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)

        # Get property_id from query parameters (optional)
        property_id = request.query_params.get('property_id', None)
        
        # Get all payments for landlord's properties
        properties = Property.objects.filter(landlord=user)
        
        # Filter by specific property if provided
        if property_id:
            try:
                properties = properties.filter(id=property_id)
                if not properties.exists():
                    return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)
            except (ValueError, TypeError):
                return Response({"error": "Invalid property ID"}, status=status.HTTP_400_BAD_REQUEST)
        
        units = Unit.objects.filter(property_obj__in=properties)
        
        # Use 'completed' status (lowercase) which matches the Payment model choices
        payments = Payment.objects.filter(unit__in=units, status='completed').select_related('unit', 'tenant').order_by('-created_at')
        
        property_name = properties.first().name if property_id and properties.exists() else "all_properties"
        print(f"🔍 CSV Export - User: {user.email}, Property: {property_name}, Properties: {properties.count()}, Units: {units.count()}, Payments: {payments.count()}")

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        filename = f'rent_payments_{property_name}.csv' if property_id else 'rent_payments.csv'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Unit Number', 'Tenant', 'Amount', 'Payment Type', 'M-Pesa Receipt', 'Property'])

        for payment in payments:
            writer.writerow([
                payment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                payment.unit.unit_number,
                payment.tenant.full_name if payment.tenant else 'N/A',
                payment.amount,
                payment.payment_type,
                payment.mpesa_receipt or '',
                payment.unit.property_obj.name if payment.unit.property_obj else 'N/A'
            ])

        return response


class TestMpesaView(APIView):
    """
    Test endpoint for M-Pesa integration
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": "M-Pesa test endpoint",
            "mpesa_env": settings.MPESA_ENV,
            "shortcode": settings.MPESA_SHORTCODE
        })

    def post(self, request):
        # Test token generation
        token = generate_access_token()
        if token:
            return Response({
                "success": True,
                "message": "M-Pesa token generated successfully",
                "token_preview": token[:10] + "..."
            })
        else:
            return Response({
                "success": False,
                "message": "Failed to generate M-Pesa token"
            }, status=400)

# Add this import at the top
from rest_framework.decorators import action
from rest_framework import viewsets
class BulkRentUpdateView(APIView):
    """
    Handle bulk rent updates for units - FIXED VERSION
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            print(f"🔍 BULK UPDATE - User: {user.email}, Type: {user.user_type}")  # DEBUG
            
            if user.user_type != 'landlord':
                return Response({"error": "Only landlords can update rents"}, status=status.HTTP_403_FORBIDDEN)

            update_type = request.data.get('update_type')  # 'percentage' or 'fixed'
            amount = request.data.get('amount')
            unit_type_filter = request.data.get('unit_type_filter', 'all')
            
            print(f"🔍 BULK UPDATE - Request data: {request.data}")  # DEBUG

            # Validate input
            if not update_type or not amount:
                return Response({"error": "Update type and amount are required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                amount = float(amount)
                if amount <= 0:
                    return Response({"error": "Amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({"error": "Amount must be a valid number"}, status=status.HTTP_400_BAD_REQUEST)

            # Get landlord's units
            landlord_units = Unit.objects.filter(property_obj__landlord=user).select_related('unit_type')
            print(f"🔍 BULK UPDATE - Total landlord units: {landlord_units.count()}")  # DEBUG
            
            # Apply filters - FIXED FILTERING LOGIC
            if unit_type_filter != 'all':
                print(f"🔍 BULK UPDATE - Filtering by unit type: {unit_type_filter}")  # DEBUG
                
                # Check if any units have this unit type name
                units_with_type = landlord_units.filter(unit_type__name=unit_type_filter)
                print(f"🔍 BULK UPDATE - Units with type '{unit_type_filter}': {units_with_type.count()}")  # DEBUG
                
                # Debug: List all available unit types
                available_types = landlord_units.exclude(unit_type__isnull=True).values_list('unit_type__name', flat=True).distinct()
                print(f"🔍 BULK UPDATE - Available unit types: {list(available_types)}")  # DEBUG
                
                landlord_units = units_with_type

            print(f"🔍 BULK UPDATE - Final filtered units: {landlord_units.count()}")  # DEBUG

            # Calculate new rents and prepare updates
            updates = []
            preview_data = []
            
            for unit in landlord_units:
                old_rent = float(unit.rent)
                new_rent = old_rent
                
                if update_type == 'percentage':
                    new_rent = round(old_rent * (1 + amount / 100))
                elif update_type == 'fixed':
                    new_rent = round(old_rent + amount)
                
                # Always include unit in preview, even if rent doesn't change
                preview_data.append({
                    'unit_id': unit.id,
                    'unit_number': unit.unit_number,
                    'unit_type': unit.unit_type.name if unit.unit_type else 'N/A',
                    'old_rent': old_rent,
                    'new_rent': new_rent,
                    'increase': new_rent - old_rent
                })
                
                # Only add to updates if rent actually changes
                if new_rent != old_rent:
                    updates.append({
                        'unit_id': unit.id,
                        'new_rent': new_rent
                    })

            print(f"🔍 BULK UPDATE - Preview data count: {len(preview_data)}")  # DEBUG
            print(f"🔍 BULK UPDATE - Actual updates count: {len(updates)}")  # DEBUG

            # If this is a preview request, return preview data
            if request.data.get('preview_only'):
                total_increase = sum(item['increase'] for item in preview_data)
                total_new_revenue = sum(item['new_rent'] for item in preview_data)
                
                print(f"🔍 BULK UPDATE - Returning preview for {len(preview_data)} units")  # DEBUG
                
                return Response({
                    'preview_data': preview_data,
                    'summary': {
                        'units_affected': len(preview_data),
                        'total_increase': total_increase,
                        'total_new_revenue': total_new_revenue
                    }
                })

            # Apply the actual updates
            updated_count = 0
            for update in updates:
                try:
                    unit = Unit.objects.get(id=update['unit_id'])
                    old_rent = float(unit.rent)
                    unit.rent = update['new_rent']
                    
                    # Recalculate rent remaining based on payments
                    total_paid = Payment.objects.filter(
                        unit=unit, 
                        status='Success',
                        payment_type='rent'
                    ).aggregate(total=Sum('amount'))['total'] or 0
                    
                    unit.rent_paid = total_paid
                    unit.rent_remaining = unit.rent - unit.rent_paid
                    unit.save()
                    updated_count += 1
                    
                    print(f"✅ Updated unit {unit.unit_number}: {old_rent} → {unit.rent}")
                    
                except Unit.DoesNotExist:
                    print(f"❌ Unit not found: {update['unit_id']}")
                    continue
                except Exception as e:
                    logger.error(f"Error updating unit {update['unit_id']}: {str(e)}")
                    continue

            # Log the bulk update
            logger.info(f"Bulk rent update completed by {user.email}. Units updated: {updated_count}")

            return Response({
                'success': True,
                'message': f'Successfully updated rent for {updated_count} units',
                'units_updated': updated_count,
                'details': {
                    'total_units_processed': len(landlord_units),
                    'units_with_rent_changes': len(updates),
                    'units_actually_updated': updated_count
                }
            })

        except Exception as e:
            logger.error(f"Bulk rent update error: {str(e)}", exc_info=True)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UnitRentUpdateView(APIView):
    """
    Update individual unit rent
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, unit_id):
        try:
            unit = get_object_or_404(Unit, id=unit_id)
            user = request.user

            # Check if user has permission to update this unit
            if user.user_type == 'landlord' and unit.property_obj.landlord != user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            new_rent = request.data.get('rent')
            if not new_rent:
                return Response({"error": "Rent amount is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                new_rent = float(new_rent)
                if new_rent <= 0:
                    return Response({"error": "Rent must be positive"}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({"error": "Rent must be a valid number"}, status=status.HTTP_400_BAD_REQUEST)

            # Update unit rent
            old_rent = float(unit.rent)
            unit.rent = new_rent
            
            # Recalculate rent remaining
            total_paid = Payment.objects.filter(
                unit=unit, 
                status='Success',
                payment_type='rent'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            unit.rent_paid = total_paid
            unit.rent_remaining = unit.rent - unit.rent_paid
            unit.save()

            logger.info(f"Unit {unit.unit_number} rent updated from {old_rent} to {new_rent} by {user.email}")

            return Response({
                'success': True,
                'message': 'Rent updated successfully',
                'unit': {
                    'id': unit.id,
                    'unit_number': unit.unit_number,
                    'rent': unit.rent,
                    'rent_paid': unit.rent_paid,
                    'rent_remaining': unit.rent_remaining
                }
            })

        except Exception as e:
            logger.error(f"Unit rent update error: {str(e)}")
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        