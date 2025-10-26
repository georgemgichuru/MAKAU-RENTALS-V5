# Quick Fix: Report Submission Loading Forever

## The Problem
When submitting a report, it keeps loading and never completes because Celery (async task worker) is not running, causing the email sending task to hang.

## The Solution
You have 3 options:

---

## Option 1: Disable Async Email (RECOMMENDED FOR NOW) ⭐

This is the quickest fix to get reports working immediately.

### Steps:

1. **Navigate to backend directory:**
   ```powershell
   cd "Makau Rentals\app"
   ```

2. **Edit your `.env` file** (or create one if it doesn't exist):
   ```env
   EMAIL_ASYNC_ENABLED=False
   EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
   ```

3. **Restart Django server:**
   ```powershell
   python manage.py runserver
   ```

4. **Test report submission:**
   - Go to frontend
   - Submit a report
   - Should work instantly now
   - Email will be printed in Django console instead of sent

**✅ Reports will work immediately**
**📧 Emails print to console (not sent)**

---

## Option 2: Run Celery Worker (FOR PRODUCTION)

Use this if you want actual emails to be sent asynchronously.

### Steps:

1. **Ensure Redis is installed and running:**
   ```powershell
   # Install Redis for Windows
   # Download from: https://github.com/microsoftarchive/redis/releases
   # Or use Docker: docker run -d -p 6379:6379 redis
   ```

2. **Terminal 1 - Django:**
   ```powershell
   cd "Makau Rentals\app"
   python manage.py runserver
   ```

3. **Terminal 2 - Celery Worker:**
   ```powershell
   cd "Makau Rentals\app"
   celery -A app worker --loglevel=info --pool=solo
   ```

4. **Edit `.env`:**
   ```env
   EMAIL_ASYNC_ENABLED=True
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   ```

**✅ Reports work**
**✅ Emails sent asynchronously**
**⚠️ Requires 2 terminals running**

---

## Option 3: Synchronous Email (MIDDLE GROUND)

Send emails immediately but synchronously (without Celery).

### Steps:

1. **Edit `.env`:**
   ```env
   EMAIL_ASYNC_ENABLED=False
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-gmail-app-password
   ```

2. **Setup Gmail App Password:**
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate App Password
   - Use App Password in `.env`

**✅ Reports work**
**✅ Real emails sent**
**⚠️ Slightly slower (waits for email to send)**

---

## How to Test

1. **Start backend:**
   ```powershell
   cd "Makau Rentals\app"
   python manage.py runserver
   ```

2. **Start frontend:**
   ```powershell
   cd Makao-Center-V4
   npm run dev
   ```

3. **Login as tenant** with assigned unit

4. **Submit a report:**
   - Fill all fields
   - Click Submit
   - Should redirect to dashboard after 2 seconds

5. **Check results:**
   - **Option 1**: Email appears in Django console
   - **Option 2/3**: Email sent to landlord

---

## Verification

### ✅ Success Indicators:
- Form submits quickly (< 2 seconds)
- Success toast appears
- Redirected to dashboard
- Report appears in database
- Email in console (Option 1) or sent (Option 2/3)

### ❌ Still Having Issues?

**Check browser console:**
```
Press F12 → Console tab
Look for errors or "Submitting report:" log
```

**Check Django terminal:**
```
Look for:
INFO Report X created successfully by tenant...
```

**Check database:**
```powershell
python manage.py shell
>>> from communication.models import Report
>>> Report.objects.all()
```

---

## Current Status

The code has been updated with:
- ✅ Automatic fallback to sync email if Celery unavailable
- ✅ Better error logging
- ✅ EMAIL_ASYNC_ENABLED configuration check
- ✅ Won't hang even if Celery is down

You just need to set `EMAIL_ASYNC_ENABLED=False` in your `.env` file!

---

## Recommended Setup for Development

Create/edit `.env` file in `Makau Rentals/app/`:

```env
# Development Settings
DEBUG=True
SECRET_KEY=your-secret-key

# Email - Console Backend (No real emails)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_ASYNC_ENABLED=False

# Frontend
FRONTEND_URL=http://localhost:5173

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/makau_rentals

# M-Pesa (use sandbox values)
MPESA_ENV=sandbox
# ... your mpesa credentials ...
```

Then restart Django and everything should work! 🚀
