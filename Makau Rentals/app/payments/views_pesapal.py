"""
PesaPal Payment Views
All payment operations now use PesaPal payment gateway
"""

from django.http import JsonResponse, HttpResponse
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
import json
import csv
import uuid
import logging
from decimal import Decimal
from datetime import datetime, timedelta

from accounts.models import Unit, UnitType, Property, Subscription, CustomUser
from .models import Payment, SubscriptionPayment
from .pesapal_service import pesapal_service, validate_payment
from .serializers import PaymentSerializer, SubscriptionPaymentSerializer
from .email_notifications import (
    send_rent_payment_confirmation,
    send_subscription_payment_confirmation,
    send_deposit_payment_confirmation
)
from .payment_utils import calculate_total_with_fee

logger = logging.getLogger(__name__)


# ====================================================================================
# PESAPAL PAYMENT INITIATION VIEWS
# ====================================================================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_rent_payment(request, unit_id):
    """
    Initiate PesaPal payment for rent
    """
    try:
        unit = get_object_or_404(Unit, id=unit_id)
        tenant = request.user

        # Validate tenant owns the unit AND user is a tenant
        if not getattr(request.user, 'is_tenant', False):
            return Response({"error": "Only tenants can make rent payments"}, status=status.HTTP_403_FORBIDDEN)
        
        if unit.tenant != tenant:
            return Response({"error": "You don't have permission to pay for this unit"}, status=status.HTTP_403_FORBIDDEN)

        # Check if rent is already paid
        if unit.rent_remaining <= 0:
            return Response({"error": "Rent is already paid for this unit"}, status=status.HTTP_400_BAD_REQUEST)

        # Get amount from request body
        base_amount = request.data.get('amount')
        if not base_amount:
            return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        base_amount = float(base_amount)
        
        # Validate amount doesn't exceed rent remaining
        if base_amount > unit.rent_remaining:
            return Response({
                "error": f"Amount exceeds rent remaining (KES {unit.rent_remaining})"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if base_amount <= 0:
            return Response({"error": "Amount must be greater than zero"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate total amount including PesaPal fee (3.5%)
        # This ensures we receive the full intended amount
        total_amount, processing_fee = calculate_total_with_fee(base_amount)
        
        phone_number = tenant.phone_number
        email = tenant.email

        if not phone_number:
            return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate payment parameters using the total amount
        is_valid, validation_result = validate_payment(phone_number, float(total_amount), email)
        if not is_valid:
            return Response({"error": validation_result}, status=status.HTTP_400_BAD_REQUEST)
        
        phone_number = validation_result  # Use cleaned phone number

        # Create pending payment record with base amount (what goes to landlord)
        payment = Payment.objects.create(
            tenant=tenant,
            unit=unit,
            amount=base_amount,
            status="pending",
            payment_type="rent"
        )

        # Generate unique merchant reference
        merchant_reference = f"RENT-{payment.id}-{uuid.uuid4().hex[:8].upper()}"
        payment.reference_number = merchant_reference
        payment.save()

        # Initiate PesaPal payment with TOTAL amount (including fee)
        description = f"Rent payment for {unit.unit_number}"
        callback_url = f"{settings.FRONTEND_URL}/tenant/payments?payment_id={payment.id}"

        pesapal_response = pesapal_service.submit_order(
            amount=float(total_amount),  # Customer pays this amount (includes fee)
            description=description,
            phone_number=phone_number,
            email=email,
            merchant_reference=merchant_reference,
            callback_url=callback_url
        )

        if pesapal_response:
            # Store tracking ID in payment record
            payment.mpesa_checkout_request_id = pesapal_response['order_tracking_id']
            payment.save()

            # Cache payment data for callback
            cache_key = f"pesapal_rent_{pesapal_response['order_tracking_id']}"
            cache.set(cache_key, {
                "payment_id": payment.id,
                "unit_id": unit.id,
                "amount": float(base_amount),  # Store base amount for records
                "tenant_id": tenant.id,
                "merchant_reference": merchant_reference
            }, timeout=1800)  # 30 minutes

            logger.info(f"PesaPal rent payment initiated: payment_id={payment.id}, tracking_id={pesapal_response['order_tracking_id']}")

            return Response({
                "success": True,
                "message": "Payment initiated successfully",
                "payment_id": payment.id,
                "order_tracking_id": pesapal_response['order_tracking_id'],
                "redirect_url": pesapal_response['redirect_url'],
                "merchant_reference": merchant_reference
            })
        else:
            payment.status = "failed"
            payment.failure_reason = "Failed to initiate PesaPal payment"
            payment.save()
            
            return Response({
                "error": "Failed to initiate payment",
                "details": "Unable to connect to payment gateway"
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Rent payment initiation error: {str(e)}", exc_info=True)
        return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_subscription_payment(request):
    """
    Initiate PesaPal payment for subscription
    """
    try:
        user = request.user
        # Accept both legacy 'plan' and new 'subscription_type'
        plan = request.data.get('subscription_type') or request.data.get('plan')
        # Amount can be passed explicitly from the frontend
        amount = request.data.get('amount')
        email = user.email
        # Use user's saved phone number; no longer required as input
        phone_number = getattr(user, 'phone_number', None)

        if not plan and not amount:
            return Response({"error": "Subscription type or amount is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate plan and/or derive amount when not explicitly provided
        plan_amounts = {
            'starter': 2000,
            'basic': 2500,
            'professional': 4500,
            'onetime': 40000
        }

        if amount is None:
            # If amount not provided, plan must be valid
            if plan not in plan_amounts:
                return Response({
                    "error": f"Invalid plan '{plan}'. Valid plans are: {', '.join(plan_amounts.keys())}"
                }, status=status.HTTP_400_BAD_REQUEST)
            amount = plan_amounts[plan]

        try:
            base_amount = float(amount)
        except (TypeError, ValueError):
            return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        if base_amount <= 0:
            return Response({"error": "Amount must be greater than zero"}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate total amount including PesaPal fee (3.5%)
        total_amount, processing_fee = calculate_total_with_fee(base_amount)

        # Create pending subscription payment record with base amount
        subscription_payment = SubscriptionPayment.objects.create(
            user=user,
            amount=Decimal(base_amount),
            subscription_type=plan or 'custom',
            status="Pending"
        )

        # Generate unique merchant reference
        merchant_reference = f"SUB-{subscription_payment.id}-{uuid.uuid4().hex[:8].upper()}"

        # Initiate PesaPal payment with TOTAL amount (including fee)
        description = f"Subscription payment for {plan} plan"
        callback_url = f"{settings.FRONTEND_URL}/landlord/subscription?payment_id={subscription_payment.id}"

        pesapal_response = pesapal_service.submit_order(
            amount=float(total_amount),  # Customer pays this amount (includes fee)
            description=description,
            phone_number=phone_number,
            email=email,
            merchant_reference=merchant_reference,
            callback_url=callback_url
        )

        if pesapal_response:
            # Store tracking ID
            subscription_payment.mpesa_checkout_request_id = pesapal_response['order_tracking_id']
            subscription_payment.save()

            # Cache payment data
            cache_key = f"pesapal_sub_{pesapal_response['order_tracking_id']}"
            cache.set(cache_key, {
                "subscription_payment_id": subscription_payment.id,
                "user_id": user.id,
                "plan": plan,
                "amount": float(base_amount),  # Store base amount for records
                "merchant_reference": merchant_reference
            }, timeout=1800)

            logger.info(f"PesaPal subscription payment initiated: id={subscription_payment.id}, tracking_id={pesapal_response['order_tracking_id']}")

            return Response({
                "success": True,
                "message": "Subscription payment initiated successfully",
                # Keep legacy key and add generic payment_id for frontend consistency
                "subscription_payment_id": subscription_payment.id,
                "payment_id": subscription_payment.id,
                "order_tracking_id": pesapal_response['order_tracking_id'],
                "redirect_url": pesapal_response['redirect_url'],
                "merchant_reference": merchant_reference
            })
        else:
            subscription_payment.status = "Failed"
            subscription_payment.save()
            
            return Response({
                "error": "Failed to initiate subscription payment",
                "details": "Unable to connect to payment gateway"
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Subscription payment initiation error: {str(e)}", exc_info=True)
        return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InitiateDepositPaymentView(APIView):
    """
    Initiate deposit payment for authenticated tenant
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            unit_id = request.data.get('unit_id')
            unit = get_object_or_404(Unit, id=unit_id)

            if not unit.is_available:
                return Response({"error": "Unit is not available"}, status=status.HTTP_400_BAD_REQUEST)

            tenant = request.user
            base_amount = float(unit.deposit) if unit.deposit else float(unit.rent)
            phone_number = tenant.phone_number
            email = tenant.email

            if not phone_number:
                return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Calculate total amount including PesaPal fee (3.5%)
            total_amount, processing_fee = calculate_total_with_fee(base_amount)

            # Validate payment with total amount
            is_valid, validation_result = validate_payment(phone_number, float(total_amount), email)
            if not is_valid:
                return Response({"error": validation_result}, status=status.HTTP_400_BAD_REQUEST)

            phone_number = validation_result

            # Create pending payment with base amount
            payment = Payment.objects.create(
                tenant=tenant,
                unit=unit,
                amount=base_amount,
                status="pending",
                payment_type="deposit"
            )

            merchant_reference = f"DEPOSIT-{payment.id}-{uuid.uuid4().hex[:8].upper()}"
            payment.reference_number = merchant_reference
            payment.save()

            # Initiate PesaPal payment with TOTAL amount (including fee)
            description = f"Deposit payment for {unit.unit_number}"
            callback_url = f"{settings.FRONTEND_URL}/tenant/dashboard?payment_id={payment.id}"

            pesapal_response = pesapal_service.submit_order(
                amount=float(total_amount),  # Customer pays this amount (includes fee)
                description=description,
                phone_number=phone_number,
                email=email,
                merchant_reference=merchant_reference,
                callback_url=callback_url
            )

            if pesapal_response:
                payment.mpesa_checkout_request_id = pesapal_response['order_tracking_id']
                payment.save()

                cache.set(f"pesapal_deposit_{pesapal_response['order_tracking_id']}", {
                    "payment_id": payment.id,
                    "unit_id": unit.id,
                    "amount": float(base_amount),  # Store base amount for records
                    "tenant_id": tenant.id,
                    "merchant_reference": merchant_reference
                }, timeout=1800)

                logger.info(f"Deposit payment initiated: id={payment.id}")

                return Response({
                    "success": True,
                    "message": "Deposit payment initiated successfully",
                    "payment_id": payment.id,
                    "order_tracking_id": pesapal_response['order_tracking_id'],
                    "redirect_url": pesapal_response['redirect_url']
                })
            else:
                payment.status = "failed"
                payment.save()
                return Response({
                    "error": "Failed to initiate deposit payment"
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Deposit payment error: {str(e)}", exc_info=True)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InitiateDepositPaymentRegistrationView(APIView):
    """
    Initiate deposit payment during registration (no auth required)
    """
    permission_classes = []

    def post(self, request):
        try:
            unit_id = request.data.get('unit_id')
            phone_number = request.data.get('phone_number')
            email = request.data.get('email', 'tenant@example.com')
            session_id = request.data.get('session_id')
            amount = request.data.get('amount')

            logger.info(f"Registration deposit request: unit_id={unit_id}, phone={phone_number}, amount={amount}")

            try:
                unit_id = int(unit_id)
            except (ValueError, TypeError):
                return Response({"error": "Unit ID must be a valid integer"}, status=status.HTTP_400_BAD_REQUEST)

            if not phone_number:
                return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)

            unit = get_object_or_404(Unit, id=unit_id)

            if not unit.is_available:
                return Response({"error": "Unit is not available"}, status=status.HTTP_400_BAD_REQUEST)

            # Use amount from request or fallback to unit deposit/rent
            if amount:
                try:
                    base_amount = float(amount)
                except (ValueError, TypeError):
                    return Response({"error": "Invalid amount format"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                base_amount = float(unit.deposit) if unit.deposit and float(unit.deposit) > 0 else float(unit.rent)

            if base_amount <= 0:
                logger.error(f"Invalid amount for unit {unit.id}: {base_amount}")
                return Response({"error": "Deposit amount must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

            # Calculate total amount including PesaPal fee (3.5%)
            total_amount, processing_fee = calculate_total_with_fee(base_amount)

            # Validate payment with total amount
            is_valid, validation_result = validate_payment(phone_number, float(total_amount), email)
            if not is_valid:
                logger.error(f"Payment validation failed: {validation_result}")
                return Response({"error": validation_result}, status=status.HTTP_400_BAD_REQUEST)

            phone_number = validation_result

            # Create payment without tenant (will be linked during registration)
            # Store session_id and email in description for tracking even if cache expires
            payment = Payment.objects.create(
                unit=unit,
                amount=base_amount,
                status="pending",
                payment_type="deposit",
                description=f"Registration deposit - Session: {session_id} - Email: {email}"  # ✅ Store session_id AND email for reliable tracking
            )

            merchant_reference = f"DEPOSIT-REG-{payment.id}-{uuid.uuid4().hex[:8].upper()}"
            payment.reference_number = merchant_reference
            payment.save()

            # Initiate PesaPal payment with TOTAL amount (including fee)
            description = f"Deposit payment for {unit.unit_number} (Registration)"
            callback_url = f"{settings.FRONTEND_URL}/register/payment-success?payment_id={payment.id}&session_id={session_id}"

            pesapal_response = pesapal_service.submit_order(
                amount=float(total_amount),  # Customer pays this amount (includes fee)
                description=description,
                phone_number=phone_number,
                email=email,
                merchant_reference=merchant_reference,
                callback_url=callback_url
            )

            if pesapal_response:
                payment.mpesa_checkout_request_id = pesapal_response['order_tracking_id']
                payment.save()

                cache.set(f"pesapal_deposit_reg_{pesapal_response['order_tracking_id']}", {
                    "payment_id": payment.id,
                    "unit_id": unit.id,
                    "amount": float(base_amount),  # Store base amount for records
                    "phone_number": phone_number,
                    "session_id": session_id,
                    "merchant_reference": merchant_reference
                }, timeout=1800)

                logger.info(f"Registration deposit payment initiated: id={payment.id}, tracking_id={pesapal_response['order_tracking_id']}")

                return Response({
                    "success": True,
                    "message": "Deposit payment initiated successfully",
                    "payment_id": payment.id,
                    "order_tracking_id": pesapal_response['order_tracking_id'],
                    "redirect_url": pesapal_response['redirect_url']
                })
            else:
                payment.status = "failed"
                payment.save()
                logger.error("PesaPal order submission failed")
                return Response({
                    "error": "Failed to initiate deposit payment",
                    "details": "Unable to connect to payment gateway"
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"❌ Registration deposit error: {str(e)}", exc_info=True)
            return Response({"error": "Internal server error", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ====================================================================================
# PESAPAL CALLBACK/IPN HANDLER
# ====================================================================================

@csrf_exempt
def pesapal_ipn_callback(request):
    """
    Handle PesaPal IPN (Instant Payment Notification)
    This is called by PesaPal when payment status changes
    """
    try:
        # PesaPal sends order_tracking_id and merchant_reference as query parameters
        order_tracking_id = request.GET.get('OrderTrackingId')
        merchant_reference = request.GET.get('OrderMerchantReference')

        logger.info(f"📥 PesaPal IPN received: tracking_id={order_tracking_id}, ref={merchant_reference}")

        if not order_tracking_id:
            logger.error("No OrderTrackingId in IPN callback")
            return JsonResponse({"status": "error", "message": "Missing OrderTrackingId"})

        # Query transaction status from PesaPal
        transaction_status = pesapal_service.get_transaction_status(order_tracking_id)

        if not transaction_status:
            logger.error(f"Failed to get transaction status for {order_tracking_id}")
            return JsonResponse({"status": "error", "message": "Failed to query transaction status"})

        payment_status = transaction_status.get('payment_status_description', '').lower()
        payment_method = transaction_status.get('payment_method')
        confirmation_code = transaction_status.get('confirmation_code')
        amount = transaction_status.get('amount')

        logger.info(f"Transaction status: {payment_status}, method: {payment_method}, code: {confirmation_code}")

        # Determine if payment was successful
        if payment_status in ['completed', 'success']:
            # Check cache for payment type
            cached_rent = cache.get(f"pesapal_rent_{order_tracking_id}")
            cached_sub = cache.get(f"pesapal_sub_{order_tracking_id}")
            cached_deposit = cache.get(f"pesapal_deposit_{order_tracking_id}")
            cached_deposit_reg = cache.get(f"pesapal_deposit_reg_{order_tracking_id}")

            if cached_rent:
                # Process rent payment
                handle_successful_rent_payment(cached_rent, confirmation_code, amount)
                cache.delete(f"pesapal_rent_{order_tracking_id}")
                
            elif cached_sub:
                # Process subscription payment
                handle_successful_subscription_payment(cached_sub, confirmation_code, amount)
                cache.delete(f"pesapal_sub_{order_tracking_id}")
                
            elif cached_deposit or cached_deposit_reg:
                # Process deposit payment
                cached_data = cached_deposit or cached_deposit_reg
                is_registration = bool(cached_deposit_reg)
                handle_successful_deposit_payment(cached_data, confirmation_code, amount, is_registration)
                cache.delete(f"pesapal_deposit_{order_tracking_id}")
                cache.delete(f"pesapal_deposit_reg_{order_tracking_id}")
            else:
                logger.warning(f"No cached data found for {order_tracking_id}")

        elif payment_status in ['failed', 'cancelled']:
            # Mark payment as failed
            mark_payment_as_failed(order_tracking_id, payment_status)

        return JsonResponse({"status": "success", "message": "IPN processed"})

    except Exception as e:
        logger.error(f"IPN callback error: {str(e)}", exc_info=True)
        return JsonResponse({"status": "error", "message": "Internal error"})


def handle_successful_rent_payment(cached_data, confirmation_code, amount):
    """Helper function to process successful rent payment"""
    try:
        payment = Payment.objects.get(id=cached_data["payment_id"])
        unit = payment.unit

        payment.status = "completed"
        payment.mpesa_receipt = confirmation_code or f"PESAPAL-{payment.id}"
        if amount:
            payment.amount = Decimal(amount)
        payment.save()

        # Update unit rent_paid
        paid_amount = Decimal(amount) if amount else payment.amount
        unit.rent_paid += paid_amount
        unit.rent_remaining = unit.rent - unit.rent_paid
        unit.save()

        logger.info(f"Rent payment {payment.id} completed successfully")
        logger.info(f"Unit {unit.unit_number} - paid: {unit.rent_paid}, remaining: {unit.rent_remaining}")

        # Send confirmation emails to tenant and landlord
        send_rent_payment_confirmation(payment)

    except Payment.DoesNotExist:
        logger.error(f"Payment not found: {cached_data['payment_id']}")
    except Exception as e:
        logger.error(f"Error processing rent payment: {str(e)}")


def handle_successful_subscription_payment(cached_data, confirmation_code, amount):
    """Helper function to process successful subscription payment"""
    try:
        subscription_payment = SubscriptionPayment.objects.get(id=cached_data["subscription_payment_id"])
        user = subscription_payment.user

        subscription_payment.status = "Success"
        subscription_payment.mpesa_receipt_number = confirmation_code or f"PESAPAL-SUB-{subscription_payment.id}"
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
            subscription.plan = subscription_payment.subscription_type
            subscription.expiry_date = timezone.now() + timedelta(days=30)
            subscription.save()

        logger.info(f"Subscription payment {subscription_payment.id} completed")
        logger.info(f"User {user.email} subscription updated to {subscription_payment.subscription_type}")

        # Send confirmation email to landlord
        send_subscription_payment_confirmation(subscription_payment)

    except SubscriptionPayment.DoesNotExist:
        logger.error(f"Subscription payment not found: {cached_data['subscription_payment_id']}")
    except Exception as e:
        logger.error(f"Error processing subscription payment: {str(e)}")


def handle_successful_deposit_payment(cached_data, confirmation_code, amount, is_registration=False):
    """Helper function to process successful deposit payment"""
    try:
        payment = Payment.objects.get(id=cached_data["payment_id"])
        unit = payment.unit

        payment.status = "completed"
        payment.mpesa_receipt = confirmation_code or f"PESAPAL-DEP-{payment.id}"
        if amount:
            payment.amount = Decimal(amount)
        payment.save()

        # For registration, just reserve the unit
        if is_registration:
            unit.is_available = False
            unit.save()
            logger.info(f"Unit {unit.unit_number} reserved via registration deposit")
        else:
            # Regular deposit - assign tenant
            if payment.tenant:
                unit.is_available = False
                unit.tenant = payment.tenant
                unit.assigned_date = timezone.now()
                unit.save()
                logger.info(f"Unit {unit.unit_number} assigned to tenant {payment.tenant.email}")

        logger.info(f"Deposit payment {payment.id} completed successfully")

        # Send confirmation emails to tenant and landlord
        send_deposit_payment_confirmation(payment, is_registration)

    except Payment.DoesNotExist:
        logger.error(f"Deposit payment not found: {cached_data['payment_id']}")
    except Exception as e:
        logger.error(f"Error processing deposit payment: {str(e)}")


def mark_payment_as_failed(order_tracking_id, reason):
    """Mark payment as failed based on order tracking ID"""
    try:
        # Try to find payment by tracking ID
        payment = Payment.objects.filter(mpesa_checkout_request_id=order_tracking_id).first()
        if payment:
            payment.status = "failed"
            payment.failure_reason = reason
            payment.save()
            logger.info(f"Payment {payment.id} marked as failed: {reason}")
            return

        # Try subscription payment
        sub_payment = SubscriptionPayment.objects.filter(mpesa_checkout_request_id=order_tracking_id).first()
        if sub_payment:
            sub_payment.status = "Failed"
            sub_payment.save()
            logger.info(f"Subscription payment {sub_payment.id} marked as failed: {reason}")

    except Exception as e:
        logger.error(f"Error marking payment as failed: {str(e)}")


# ====================================================================================
# PAYMENT STATUS CHECK VIEWS
# ====================================================================================

class RentPaymentStatusView(APIView):
    """Check rent payment status"""
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = Payment.objects.get(id=payment_id, payment_type='rent')

            # Check permissions
            if getattr(request.user, 'is_tenant', False) and payment.tenant != request.user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            if getattr(request.user, 'is_landlord', False) and payment.unit.property_obj.landlord != request.user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            # If payment is still pending, check PesaPal status
            if payment.status == 'pending' and payment.mpesa_checkout_request_id:
                transaction_status = pesapal_service.get_transaction_status(payment.mpesa_checkout_request_id)
                if transaction_status:
                    status_desc = transaction_status.get('payment_status_description', '').lower()
                    if status_desc in ['completed', 'success']:
                        payment.status = 'completed'
                        payment.mpesa_receipt = transaction_status.get('confirmation_code')
                        payment.save()

            return Response({
                "id": payment.id,
                "payment_id": payment.id,
                "status": payment.status,
                "amount": float(payment.amount),
                "mpesa_receipt": payment.mpesa_receipt,
                "created_at": payment.created_at,
                "unit_id": payment.unit.id,
                "unit_number": payment.unit.unit_number,
                "failure_reason": payment.failure_reason,
                "reference_number": payment.reference_number
            })
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)


class DepositPaymentStatusView(APIView):
    """Check deposit payment status"""
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = Payment.objects.get(id=payment_id)

            # Check permissions
            if getattr(request.user, 'is_tenant', False) and payment.tenant != request.user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            if getattr(request.user, 'is_landlord', False) and payment.unit.property_obj.landlord != request.user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            # If payment is still pending, check PesaPal status
            if payment.status == 'pending' and payment.mpesa_checkout_request_id:
                transaction_status = pesapal_service.get_transaction_status(payment.mpesa_checkout_request_id)
                if transaction_status:
                    status_desc = transaction_status.get('payment_status_description', '').lower()
                    if status_desc in ['completed', 'success']:
                        payment.status = 'completed'
                        payment.mpesa_receipt = transaction_status.get('confirmation_code')
                        payment.save()

            return Response({
                "payment_id": payment.id,
                "status": payment.status,
                "amount": float(payment.amount),
                "mpesa_receipt": payment.mpesa_receipt
            })
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)


# ====================================================================================
# EXISTING DRF VIEWS (unchanged from original)
# ====================================================================================

class PaymentListCreateView(generics.ListCreateAPIView):
    """List and create rent payments"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_tenant', False):
            return Payment.objects.filter(tenant=user)
        elif getattr(user, 'is_landlord', False):
            return Payment.objects.filter(unit__property_obj__landlord=user)
        return Payment.objects.none()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)


class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete rent payment"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_tenant', False):
            return Payment.objects.filter(tenant=user)
        elif getattr(user, 'is_landlord', False):
            return Payment.objects.filter(unit__property_obj__landlord=user)
        return Payment.objects.none()


class SubscriptionPaymentListCreateView(generics.ListCreateAPIView):
    """List and create subscription payments"""
    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SubscriptionPayment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubscriptionPaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete subscription payment"""
    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SubscriptionPayment.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to return payment status for polling"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)

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
    """Get rent summary - for both landlords and tenants"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Tenant view
        if getattr(user, 'is_tenant', False):
            try:
                unit = Unit.objects.filter(tenant=user).first()
                if not unit:
                    return Response({
                        "monthly_rent": 0,
                        "rent_due": 0,
                        "rent_paid": 0,
                        "prepaid_months": 0,
                        "rent_status": "not_assigned"
                    })

                rent_paid = Payment.objects.filter(
                    unit=unit,
                    status__in=['completed', 'Success']
                ).aggregate(total=Sum('amount'))['total'] or 0

                return Response({
                    "monthly_rent": float(unit.rent or 0),
                    "rent_due": float(unit.rent_remaining or 0),
                    "rent_paid": float(rent_paid),
                    "prepaid_months": 0,
                    "rent_status": "due" if unit.rent_remaining > 0 else "paid"
                })
            except Exception as e:
                logger.error(f"Error fetching tenant rent summary: {str(e)}")
                return Response({
                    "error": "Unable to fetch rent summary"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Landlord view
        elif getattr(user, 'is_landlord', False):
            properties = Property.objects.filter(landlord=user)
            units = Unit.objects.filter(property_obj__in=properties)

            total_collected = Payment.objects.filter(
                unit__in=units,
                status__in=['completed', 'Success']
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

        else:
            return Response({"error": "Invalid user type"}, status=status.HTTP_403_FORBIDDEN)


class UnitTypeListView(generics.ListAPIView):
    """List unit types for landlord"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UnitType.objects.filter(landlord=self.request.user)


class CleanupPendingPaymentsView(APIView):
    """Clean up old pending payments"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cutoff_time = timezone.now() - timedelta(hours=1)

        rent_deleted_count = Payment.objects.filter(
            status='pending',
            created_at__lt=cutoff_time
        ).delete()

        subscription_deleted_count = SubscriptionPayment.objects.filter(
            status='Pending',
            transaction_date__lt=cutoff_time
        ).delete()

        total_deleted = rent_deleted_count[0] + subscription_deleted_count[0]

        return Response({"message": f"Cleaned up {total_deleted} pending payments"})


# ====================================================================================
# CSV EXPORT VIEWS (unchanged)
# ====================================================================================

class LandLordCSVView(APIView):
    """Export landlord payment data as CSV"""
    permission_classes = [IsAuthenticated]

    def get(self, request, property_id):
        user = request.user
        if not getattr(user, 'is_landlord', False):
            return Response({"error": "Only landlords can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)

        property_obj = get_object_or_404(Property, id=property_id, landlord=user)
        units = Unit.objects.filter(property_obj=property_obj)
        payments = Payment.objects.filter(unit__in=units, status='completed')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="landlord_payments_{property_obj.name}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Unit Number', 'Tenant', 'Amount', 'Date', 'Receipt'])

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
    """Export tenant payment data as CSV"""
    permission_classes = [IsAuthenticated]

    def get(self, request, unit_id):
        user = request.user
        unit = get_object_or_404(Unit, id=unit_id)

        if getattr(user, 'is_tenant', False) and unit.tenant != user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        if getattr(user, 'is_landlord', False) and unit.property_obj.landlord != user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        payments = Payment.objects.filter(unit=unit, status='completed')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="tenant_payments_unit_{unit.unit_number}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Amount', 'Date', 'Receipt', 'Type'])

        for payment in payments:
            writer.writerow([
                payment.amount,
                payment.created_at.strftime('%Y-%m-%d'),
                payment.mpesa_receipt or '',
                payment.payment_type
            ])

        return response


class RentPaymentsCSVView(APIView):
    """Export all rent payments data as CSV for landlord"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not getattr(user, 'is_landlord', False):
            return Response({"error": "Only landlords can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)

        property_id = request.query_params.get('property_id', None)

        properties = Property.objects.filter(landlord=user)

        if property_id:
            try:
                properties = properties.filter(id=property_id)
                if not properties.exists():
                    return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)
            except (ValueError, TypeError):
                return Response({"error": "Invalid property ID"}, status=status.HTTP_400_BAD_REQUEST)

        units = Unit.objects.filter(property_obj__in=properties)
        payments = Payment.objects.filter(unit__in=units, status='completed').select_related('unit', 'tenant').order_by('-created_at')

        property_name = properties.first().name if property_id and properties.exists() else "all_properties"

        response = HttpResponse(content_type='text/csv')
        filename = f'rent_payments_{property_name}.csv' if property_id else 'rent_payments.csv'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Unit Number', 'Tenant', 'Amount', 'Payment Type', 'Receipt', 'Property'])

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


# ====================================================================================
# BULK RENT UPDATE VIEWS (unchanged)
# ====================================================================================

class BulkRentUpdateView(APIView):
    """Handle bulk rent updates for units"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user

            if not getattr(user, 'is_landlord', False):
                return Response({"error": "Only landlords can update rents"}, status=status.HTTP_403_FORBIDDEN)

            update_type = request.data.get('update_type')
            amount = request.data.get('amount')
            unit_type_filter = request.data.get('unit_type_filter', 'all')

            if not update_type or not amount:
                return Response({"error": "Update type and amount are required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                amount = float(amount)
                if amount <= 0:
                    return Response({"error": "Amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({"error": "Amount must be a valid number"}, status=status.HTTP_400_BAD_REQUEST)

            landlord_units = Unit.objects.filter(property_obj__landlord=user).select_related('unit_type')

            if unit_type_filter != 'all':
                landlord_units = landlord_units.filter(unit_type__name=unit_type_filter)

            updates = []
            preview_data = []

            for unit in landlord_units:
                old_rent = float(unit.rent)
                new_rent = old_rent

                if update_type == 'percentage':
                    new_rent = round(old_rent * (1 + amount / 100))
                elif update_type == 'fixed':
                    new_rent = round(old_rent + amount)

                preview_data.append({
                    'unit_id': unit.id,
                    'unit_number': unit.unit_number,
                    'unit_type': unit.unit_type.name if unit.unit_type else 'N/A',
                    'old_rent': old_rent,
                    'new_rent': new_rent,
                    'increase': new_rent - old_rent
                })

                if new_rent != old_rent:
                    updates.append({
                        'unit_id': unit.id,
                        'new_rent': new_rent
                    })

            if request.data.get('preview_only'):
                total_increase = sum(item['increase'] for item in preview_data)
                total_new_revenue = sum(item['new_rent'] for item in preview_data)

                return Response({
                    'preview_data': preview_data,
                    'summary': {
                        'units_affected': len(preview_data),
                        'total_increase': total_increase,
                        'total_new_revenue': total_new_revenue
                    }
                })

            # Apply updates
            updated_count = 0
            for update in updates:
                try:
                    unit = Unit.objects.get(id=update['unit_id'])
                    unit.rent = update['new_rent']

                    total_paid = Payment.objects.filter(
                        unit=unit,
                        status__in=['completed', 'Success'],
                        payment_type='rent'
                    ).aggregate(total=Sum('amount'))['total'] or 0

                    unit.rent_paid = total_paid
                    unit.rent_remaining = unit.rent - unit.rent_paid
                    unit.save()
                    updated_count += 1

                except Unit.DoesNotExist:
                    continue
                except Exception as e:
                    logger.error(f"Error updating unit {update['unit_id']}: {str(e)}")
                    continue

            logger.info(f"Bulk rent update completed by {user.email}. Units updated: {updated_count}")

            return Response({
                'success': True,
                'message': f'Successfully updated rent for {updated_count} units',
                'units_updated': updated_count
            })

        except Exception as e:
            logger.error(f"Bulk rent update error: {str(e)}", exc_info=True)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UnitRentUpdateView(APIView):
    """Update individual unit rent"""
    permission_classes = [IsAuthenticated]

    def put(self, request, unit_id):
        try:
            unit = get_object_or_404(Unit, id=unit_id)
            user = request.user

            if getattr(user, 'is_landlord', False) and unit.property_obj.landlord != user:
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

            old_rent = float(unit.rent)
            unit.rent = new_rent

            total_paid = Payment.objects.filter(
                unit=unit,
                status__in=['completed', 'Success'],
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


class TestPesaPalView(APIView):
    """Test endpoint for PesaPal integration"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": "PesaPal test endpoint",
            "pesapal_env": settings.PESAPAL_ENV,
            "consumer_key": settings.PESAPAL_CONSUMER_KEY[:10] + "..."
        })

    def post(self, request):
        # Test token generation with diagnostics
        current_env = getattr(settings, 'PESAPAL_ENV', 'sandbox')
        results = {
            'current_env': current_env,
            'attempts': []
        }

        # First try using configured env (with caching path)
        token = pesapal_service.get_access_token()
        results['attempts'].append({
            'method': 'cached_env',
            'env': current_env,
            'ok': bool(token),
            'note': 'Used configured base_url'
        })

        # Then try explicit sandbox and live without caching
        for env in ['sandbox', 'live']:
            diag = pesapal_service.try_token_on_env(env)
            results['attempts'].append({
                'method': 'direct_env',
                'env': env,
                'ok': diag['ok'],
                'status': diag['status'],
                'base_url': diag['base_url'],
                'response': diag['data']
            })

        http_status = 200 if any(a.get('ok') for a in results['attempts']) else 400
        return Response(results, status=http_status)
