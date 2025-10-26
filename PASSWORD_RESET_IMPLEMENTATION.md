# Password Reset Implementation

## Overview
The forgot password feature has been successfully integrated into the login and signup page. Users can now reset their passwords through a secure email-based flow.

## Features Implemented

### 1. Frontend (React)
- **Forgot Password Link**: Added to the login form
- **Forgot Password Form**: Allows users to enter their email
- **Password Reset Page**: Accessible via email link to set a new password
- **Success Confirmation**: Shows success message after password reset

### 2. Backend (Django)
- **Password Reset Request Endpoint**: `/api/accounts/password/reset/`
- **Password Reset Confirm Endpoint**: `/api/accounts/password/reset/confirm/`
- **Email Notifications**: 
  - Reset link email when user requests password reset
  - Confirmation email after password is successfully changed

## User Flow

### Step 1: Request Password Reset
1. User clicks "Forgot Password?" link on the login page
2. User enters their email address
3. System sends a password reset email with a unique link

### Step 2: Reset Password
1. User clicks the link in their email (format: `http://localhost:5173/reset-password/{uid}/{token}`)
2. User is redirected to the password reset page
3. User enters and confirms their new password
4. Password must meet requirements:
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number

### Step 3: Confirmation
1. System validates the token and updates the password
2. System sends a confirmation email to the user
3. User is redirected to the login page
4. User can now log in with their new password

## Files Modified/Created

### Frontend Files
1. **LoginForm.jsx** (Modified)
   - Added forgot password states
   - Added `handleForgotPassword` function
   - Added forgot password UI toggle
   - Connected to backend API

2. **PasswordResetConfirm.jsx** (Created)
   - New component for password reset page
   - Handles password validation
   - Processes password reset with token

3. **App.jsx** (Modified)
   - Added route for password reset: `/reset-password/:uid/:token`

### Backend Files (Already Existing)
1. **views.py**
   - `PasswordResetView`: Handles email sending
   - `PasswordResetConfirmView`: Handles password update and confirmation email

2. **serializers.py**
   - `PasswordResetSerializer`: Validates email and generates token
   - `PasswordResetConfirmSerializer`: Validates token and new password

3. **urls.py**
   - Routes already configured

## Configuration Required

### Environment Variables
Ensure your `.env` file has the following configured:

```bash
# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=makaorentalmanagementsystem@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password-here
DEFAULT_FROM_EMAIL=makaorentalmanagementsystem@gmail.com
```

### Gmail App Password Setup
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Add it to `EMAIL_HOST_PASSWORD` in your `.env` file

## API Endpoints

### POST `/api/accounts/password/reset/`
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent."
}
```

**Error Response (400 Bad Request):**
```json
{
  "email": ["User with this email does not exist."]
}
```

### POST `/api/accounts/password/reset/confirm/`
Confirm password reset with token.

**Request Body:**
```json
{
  "uid": "base64-encoded-user-id",
  "token": "password-reset-token",
  "new_password": "NewPassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully."
}
```

**Error Responses:**
- Invalid UID: `{"detail": "Invalid UID"}`
- Invalid/Expired Token: `{"detail": "Invalid or expired token"}`
- Weak Password: `{"new_password": ["Password validation errors"]}`

## Email Templates

### Reset Request Email
```
Subject: Password Reset Request

Click the link to reset your password: 
http://localhost:5173/reset-password/{uid}/{token}/
```

### Confirmation Email
```
Subject: Password Reset Confirmation

Hello {user.full_name},

Your password has been successfully reset.

If you did not make this change, please contact support immediately.

Best regards,
Makao Center
```

## Security Features

1. **Token-Based Authentication**: 
   - Unique, time-limited tokens for each reset request
   - Tokens expire after a set time period
   - One-time use tokens

2. **Password Validation**:
   - Minimum length requirements
   - Complexity requirements (uppercase, lowercase, numbers)
   - Django's built-in password validators

3. **Email Verification**:
   - Reset links only sent to registered email addresses
   - Confirmation emails sent after successful reset

4. **User Notifications**:
   - Users notified when password is changed
   - Alerts if unauthorized reset attempt

## Testing

### Test the Flow
1. Start your Django backend: `python manage.py runserver`
2. Start your React frontend: `npm run dev`
3. Navigate to `http://localhost:5173/`
4. Click "Forgot Password?"
5. Enter a registered email address
6. Check your email for the reset link
7. Click the link and set a new password
8. Verify you receive a confirmation email
9. Log in with your new password

### Test Cases
- ✅ Valid email receives reset link
- ✅ Invalid email shows appropriate error
- ✅ Password requirements are validated
- ✅ Token expiration is enforced
- ✅ Confirmation email is sent
- ✅ Old password no longer works
- ✅ New password works for login

## Production Considerations

### Before Deployment:
1. **Update FRONTEND_URL**: Change to your production domain
2. **Email Service**: Consider using a dedicated email service (SendGrid, Mailgun, AWS SES)
3. **HTTPS Required**: Password reset links should use HTTPS in production
4. **Token Expiry**: Configure appropriate token expiration time
5. **Rate Limiting**: Implement rate limiting on reset endpoint to prevent abuse
6. **Logging**: Monitor password reset attempts for security

### Production Environment Variables:
```bash
FRONTEND_URL=https://yourdomain.com
EMAIL_HOST=your-production-smtp-host
EMAIL_HOST_USER=your-production-email
EMAIL_HOST_PASSWORD=your-production-password
```

## Troubleshooting

### Email Not Sending
- Check EMAIL_HOST_PASSWORD is correct
- Ensure Gmail "Less secure app access" is enabled OR use App Password
- Verify EMAIL_USE_TLS=True
- Check spam folder

### Invalid Token Error
- Token may have expired
- User may have already used the token
- Request a new password reset

### Link Not Working
- Verify FRONTEND_URL in Django settings matches your frontend URL
- Check that the route is properly configured in App.jsx
- Ensure uid and token parameters are being passed correctly

## Support
For issues or questions, contact:
- Email: makaorentalmanagementsystem@gmail.com
- Phone: +254722714334
