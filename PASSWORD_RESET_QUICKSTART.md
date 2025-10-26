# Quick Start - Password Reset Feature

## What Was Added
✅ "Forgot Password?" link on the login page
✅ Email-based password reset flow
✅ Secure token-based authentication
✅ Password reset confirmation emails

## How to Use

### As a User:
1. Click "Forgot Password?" on the login page
2. Enter your email address
3. Check your email for the reset link
4. Click the link and set a new password
5. Log in with your new password

### As a Developer - Setup Required:

#### 1. Configure Email (Required for sending emails)
Edit your `.env` file in `Makau Rentals/app/`:

```bash
# Add or update these lines:
FRONTEND_URL=http://localhost:5173
EMAIL_HOST_USER=makaorentalmanagementsystem@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
```

#### 2. Configure Frontend API URL (Required)
The frontend needs to know where your Django backend is running.

**Option A - Using ngrok (Current setup):**
- Your backend is already accessible via ngrok
- The default URL is configured in `api.js`
- No changes needed if using the existing ngrok URL

**Option B - Local Django server:**
Create a `.env` file in `Makao-Center-V4/` (copy from `.env.example`):
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

#### 3. Get Gmail App Password:
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy the 16-character password
6. Paste it in `EMAIL_HOST_PASSWORD` in your `.env` file

#### 4. Start the Application:
```bash
# Terminal 1 - Backend
cd "Makau Rentals/app"
python manage.py runserver

# Terminal 2 - Frontend
cd Makao-Center-V4
npm run dev
```

#### 5. Test It:
1. Go to http://localhost:5173
2. Click "Forgot Password?"
3. Enter a registered email
4. Check your email inbox (and spam folder)
5. Click the reset link
6. Set a new password
7. Log in with the new password

## Files Changed
- `LoginForm.jsx` - Added forgot password UI and logic
- `PasswordResetConfirm.jsx` - NEW: Password reset page
- `App.jsx` - Added route for password reset page

## Endpoints Used
- `POST /api/accounts/password/reset/` - Request reset email
- `POST /api/accounts/password/reset/confirm/` - Confirm password reset

## Support
If you encounter any issues, check `PASSWORD_RESET_IMPLEMENTATION.md` for detailed troubleshooting.

### Common Issues:

**404 Error on Password Reset:**
- Make sure your backend is running (Django on port 8000 or ngrok)
- Check that `VITE_API_BASE_URL` is set correctly in your frontend `.env` file
- Verify the backend URL matches in both frontend and backend configurations

**Email Not Sending:**
- Check `EMAIL_HOST_PASSWORD` is set with a Gmail App Password (not your regular password)
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL (http://localhost:5173)
- Check spam folder for reset emails
