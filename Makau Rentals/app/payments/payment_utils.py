"""
Payment Utility Functions
Handles payment fee calculations and processing logic
"""

from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# PesaPal transaction fee percentage
PESAPAL_FEE_PERCENTAGE = Decimal('3.5')


def calculate_pesapal_fee(amount):
    """
    Calculate PesaPal transaction fee (3.5%)
    
    Args:
        amount: Base payment amount
        
    Returns:
        Decimal: Fee amount
    """
    try:
        amount = Decimal(str(amount))
        fee = (amount * PESAPAL_FEE_PERCENTAGE) / Decimal('100')
        # Round to 2 decimal places
        return fee.quantize(Decimal('0.01'))
    except Exception as e:
        logger.error(f"Error calculating PesaPal fee: {str(e)}")
        return Decimal('0')


def calculate_total_with_fee(amount):
    """
    Calculate total amount including PesaPal fee
    
    The formula ensures we receive the intended amount:
    Total = Amount + (Amount * 3.5%)
    
    Args:
        amount: Intended payment amount (what we want to receive)
        
    Returns:
        tuple: (total_amount, fee_amount)
    """
    try:
        amount = Decimal(str(amount))
        fee = calculate_pesapal_fee(amount)
        total = amount + fee
        
        # Round to 2 decimal places
        total = total.quantize(Decimal('0.01'))
        
        logger.info(f"Payment calculation - Amount: {amount}, Fee: {fee}, Total: {total}")
        
        return total, fee
    except Exception as e:
        logger.error(f"Error calculating total with fee: {str(e)}")
        return Decimal(str(amount)), Decimal('0')


def get_payment_amount_for_display(base_amount):
    """
    Get the payment amount that will be shown to the customer
    (includes the processing fee)
    
    Args:
        base_amount: The base amount (rent, subscription, etc.)
        
    Returns:
        Decimal: Total amount customer will pay
    """
    total, _ = calculate_total_with_fee(base_amount)
    return total
