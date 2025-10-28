"""
Test Email Configuration
Run this to verify emails can be sent successfully
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    print("=" * 60)
    print("Email Configuration Test")
    print("=" * 60)
    
    print(f"\n📧 Email Backend: {settings.EMAIL_BACKEND}")
    print(f"📧 Email Host: {settings.EMAIL_HOST}")
    print(f"📧 Email Port: {settings.EMAIL_PORT}")
    print(f"📧 Email User: {settings.EMAIL_HOST_USER}")
    print(f"📧 Use TLS: {settings.EMAIL_USE_TLS}")
    
    print("\n" + "=" * 60)
    print("Sending Test Email...")
    print("=" * 60)
    
    try:
        result = send_mail(
            subject='Test Email - Makau Rentals Payment System',
            message='''
This is a test email from Makau Rentals Payment System.

If you receive this email, your email configuration is working correctly!

Payment confirmation emails will be sent automatically when:
- Tenants make rent payments
- Landlords purchase subscriptions
- Deposit payments are completed

Best regards,
Makau Rentals Team
            ''',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.EMAIL_HOST_USER],  # Send to self for testing
            fail_silently=False,
        )
        
        if result == 1:
            print("\n✅ SUCCESS! Test email sent successfully!")
            print(f"   Check inbox: {settings.EMAIL_HOST_USER}")
            print("\n💡 Email notifications are ready to use!")
        else:
            print("\n⚠️  Email might not have been sent (result = 0)")
            
    except Exception as e:
        print(f"\n❌ ERROR sending email: {str(e)}")
        print("\nPossible issues:")
        print("1. Gmail App Password might be incorrect")
        print("2. Gmail account might need 2-Step Verification enabled")
        print("3. SMTP settings might be incorrect")
        print("\nTo fix:")
        print("- Enable 2-Step Verification in your Google Account")
        print("- Generate an App Password at: https://myaccount.google.com/apppasswords")
        print("- Update EMAIL_HOST_PASSWORD in .env file")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_email()
