# Contact Information Configuration

This document outlines where the official contact information for Nyumbani Rentals Management System is configured.

## Official Contact Information

- **Email**: nyumbanirentalmanagementsystem@gmail.com
- **Phone**: +254722714334

## Configuration Locations

### Backend (Django)

1. **Email Configuration** (`Nyumbani Rentals/app/app/settings.py`)
   - `EMAIL_HOST_USER` - Set via environment variable
   - `DEFAULT_FROM_EMAIL` - Set via environment variable
   - `SERVER_EMAIL` - Set via environment variable
   - All emails sent from the system use these settings

2. **Environment Variables** (`Nyumbani Rentals/app/.env.example`)
   - `EMAIL_HOST_USER=nyumbanirentalmanagementsystem@gmail.com`
   - `DEFAULT_FROM_EMAIL=nyumbanirentalmanagementsystem@gmail.com`
   - `SERVER_EMAIL=nyumbanirentalmanagementsystem@gmail.com`
   - `DJANGO_SUPERUSER_EMAIL=nyumbanirentalmanagementsystem@gmail.com`

### Frontend (React)

1. **Subscription Payment Page** (`Makao-Center-V4/src/components/Admin/SubscriptionPaymentPage.jsx`)
   - Contact support link with email

2. **Subscription Page** (`Makao-Center-V4/src/components/Admin/SubscriptionPage.jsx`)
   - Email contact link
   - Phone contact link: `tel:+254722714334`
   - Displays both email and phone: `+254 722 714 334`

3. **SMS Purchase Page** (`Makao-Center-V4/src/components/Admin/SMSPurchasePage.jsx`)
   - Contact email in footer

4. **Admin Help Page** (`Makao-Center-V4/src/components/Admin/AdminHelp.jsx`)
   - Email Support: nyumbanirentalmanagementsystem@gmail.com
   - Phone Support: +254 722 714 334

5. **Tenant Report Issue** (`Makao-Center-V4/src/components/Tenant/TenantReportIssue.jsx`)
   - WhatsApp contact: `+254722714334`

### Documentation

1. **Subscription Payment Flow** (`SUBSCRIPTION_PAYMENT_FLOW.md`)
   - Contact & Support section
   - Email: nyumbanirentalmanagementsystem@gmail.com
   - Phone: +254722714334

## Email System Usage

The system sends emails for the following purposes:

1. **Rent Reminders** (via Celery tasks)
   - Daily rent due notifications
   - Monthly payment reminders
   - Deadline reminders

2. **Reports & Notifications**
   - Maintenance report notifications to landlords
   - Custom messages from landlords to tenants

3. **Account Management**
   - Password reset emails
   - Account notifications

All emails are sent from: `nyumbanirentalmanagementsystem@gmail.com`

## Setup Instructions

1. **Gmail Configuration**
   - Enable 2-Factor Authentication on the Gmail account
   - Generate an App Password for the application
   - Add the App Password to the `.env` file as `EMAIL_HOST_PASSWORD`

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`
   - Ensure `EMAIL_BACKEND` is set to SMTP backend for production

3. **Testing**
   - For development, use console backend: `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`
   - For production, use SMTP backend: `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`

## Contact Display Format

### Email
- Full: nyumbanirentalmanagementsystem@gmail.com
- Mailto link: `mailto:nyumbanirentalmanagementsystem@gmail.com`

### Phone
- Display format: `+254 722 714 334`
- Tel link format: `tel:+254722714334`
- WhatsApp format: `+254722714334` (no spaces)

## Notes

- All contact information is centralized in environment variables for the backend
- Frontend components display the contact information directly
- Phone number is used for WhatsApp integration in maintenance requests
- Email is used for all automated notifications and support contacts
