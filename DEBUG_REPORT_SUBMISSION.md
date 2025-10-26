# Debugging Report Submission Issue

## Problem
Report submission is loading indefinitely and not completing.

## Possible Causes

### 1. Celery Not Running (Most Likely)
**Symptom:** Request hangs when trying to send email via Celery task.

**Solution:**
The code has been updated to fallback to synchronous email if Celery is unavailable.

**To Disable Async Email Completely:**
Add to your `.env` file:
```
EMAIL_ASYNC_ENABLED=False
```

### 2. Email Configuration Issues
**Symptom:** Email sending fails and blocks the request.

**Solutions:**

**Option A: Use Console Backend (Development)**
Add to your `.env`:
```
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Option B: Disable Email Temporarily**
Comment out email sending in `communication/views.py`

### 3. CORS or Network Issues
**Symptom:** Request never reaches backend.

**Check:**
- Open browser DevTools → Network tab
- Look for the POST request to `/api/communication/reports/create/`
- Check if request is pending, failed, or succeeded

## Step-by-Step Debugging

### Step 1: Check Backend is Running
```powershell
cd "Makau Rentals\app"
python manage.py runserver
```

### Step 2: Check Django Logs
Look for errors in the console where Django is running.

### Step 3: Test API Directly
Use Postman or curl to test the endpoint:

```bash
curl -X POST http://localhost:8000/api/communication/reports/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "issue_category": "electrical",
    "priority_level": "high",
    "issue_title": "Test Report",
    "description": "Testing report submission",
    "unit": 1
  }'
```

### Step 4: Check Frontend Console
Open browser DevTools → Console tab
Look for:
- "Submitting report:" log
- Any error messages
- Network request status

### Step 5: Check Backend Response
In Django terminal, you should see:
```
INFO Report X created successfully by tenant user@example.com
INFO Sent sync email for report X
```

Or errors if email failed.

## Quick Fix: Disable Celery Dependency

### Option 1: Update .env
Create/update `.env` file in `Makau Rentals/app/`:
```env
EMAIL_ASYNC_ENABLED=False
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Option 2: Temporary Code Change
Edit `communication/views.py`, line ~20:

```python
def perform_create(self, serializer):
    import logging
    logger = logging.getLogger(__name__)
    
    report = serializer.save()
    logger.info(f"Report {report.id} created successfully")
    
    # TEMPORARY: Skip email for testing
    # from .messaging import send_report_email
    # send_report_email(report)
```

## Running Celery (If You Want Async Emails)

### Terminal 1: Django Server
```powershell
cd "Makau Rentals\app"
python manage.py runserver
```

### Terminal 2: Celery Worker
```powershell
cd "Makau Rentals\app"
celery -A app worker --loglevel=info --pool=solo
```

### Terminal 3: Celery Beat (Optional - for scheduled tasks)
```powershell
cd "Makau Rentals\app"
celery -A app beat --loglevel=info
```

**Note:** On Windows, use `--pool=solo` flag for Celery worker.

## Verify Email Settings

Check your `.env` file has email configuration:
```env
# For Gmail (requires App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# OR for development (prints to console)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## Testing Checklist

- [ ] Backend server is running
- [ ] Frontend can reach backend (check Network tab)
- [ ] Authentication token is valid
- [ ] Tenant has unit assigned
- [ ] Email backend is configured (or disabled)
- [ ] Celery is running (if EMAIL_ASYNC_ENABLED=True)
- [ ] Check Django logs for errors
- [ ] Check browser console for errors

## Common Errors

### "unit: This field is required"
**Fix:** Ensure tenant profile has `current_unit` set.

### "Permission denied"
**Fix:** Ensure `IsTenantWithUnit` permission is passing.

### Request hangs indefinitely
**Fix:** Set `EMAIL_ASYNC_ENABLED=False` in .env

### "Connection refused"
**Fix:** Check backend is running on correct port.

## Updated Code Changes

The following files were updated to fix the hanging issue:

### `communication/views.py`
- Added fallback to synchronous email if Celery unavailable
- Added proper logging
- Added `EMAIL_ASYNC_ENABLED` check

### `communication/serializers.py`
- Added auto-population of tenant and unit
- Added validation for unit assignment

### `communication/permissions.py`
- Fixed unit check to use `tenant_profile.current_unit`

## Contact

If issue persists after following this guide:
1. Check all logs (Django, Celery, browser console)
2. Share error messages for further debugging
3. Verify database has required data (tenant, unit, property)
