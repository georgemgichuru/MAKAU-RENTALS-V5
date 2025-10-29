# Django Backend Deployment to Vercel

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Git repository pushed to GitHub
- PostgreSQL database (use Vercel Postgres or external provider like Neon, Supabase, or Railway)

## Step-by-Step Deployment Guide

### 1. Prepare Your Repository

The following files have been created for you:
- ✅ `vercel.json` - Vercel configuration
- ✅ `build_files.sh` - Build script for deployment
- ✅ `requirements.txt` - Python dependencies

### 2. Set Up PostgreSQL Database

Since Vercel doesn't support SQLite in production, you need to use PostgreSQL.

**Option A: Vercel Postgres (Recommended)**
1. Go to your Vercel dashboard
2. Navigate to Storage tab
3. Create a new Postgres database
4. Copy the connection string (it will look like: `postgresql://user:password@host:5432/database`)

**Option B: External Provider**
- **Neon**: https://neon.tech (free tier available)
- **Supabase**: https://supabase.com (free tier available)
- **Railway**: https://railway.app (free tier available)

### 3. Update Database Configuration

Uncomment the PostgreSQL configuration in `app/settings.py`:

```python
# Uncomment this section:
tmpPostgres = urlparse(os.getenv("DATABASE_URL"))
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': tmpPostgres.path.replace('/', ''),
        'USER': tmpPostgres.username,
        'PASSWORD': tmpPostgres.password,
        'HOST': tmpPostgres.hostname,
        'PORT': 5432,
        'OPTIONS': dict(parse_qsl(tmpPostgres.query)),
    }
}

# Comment out the SQLite section:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'test_db.sqlite3',
#     }
# }
```

### 4. Configure Environment Variables in Vercel

Go to your project settings on Vercel and add these environment variables:

#### Required Variables:
```
SECRET_KEY=your-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://user:password@host:5432/database

# Django Superuser
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=makaorentalmanagementsystem@gmail.com
DJANGO_SUPERUSER_PASSWORD=your-strong-password
DJANGO_SUPERUSER_FULL_NAME=GEORGE MWANGI

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=makaorentalmanagementsystem@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=makaorentalmanagementsystem@gmail.com

# PesaPal Configuration
PESAPAL_CONSUMER_KEY=your-consumer-key
PESAPAL_CONSUMER_SECRET=your-consumer-secret
PESAPAL_ENV=sandbox
PESAPAL_IPN_URL=https://your-backend-url.vercel.app/api/payments/pesapal-ipn/

# Frontend URL
FRONTEND_URL=https://makao-center-v4.vercel.app

# CORS Settings
CORS_ALLOW_ALL_ORIGINS=False

# Redis (Optional - for Celery)
REDIS_URL=redis://your-redis-url

# Email Async
EMAIL_ASYNC_ENABLED=False
```

**Important Notes:**
- Generate a new SECRET_KEY for production (use: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- Set `DEBUG=False` in production
- Get Gmail App Password from: https://myaccount.google.com/apppasswords

### 5. Deploy to Vercel

#### Method 1: Via Vercel CLI (Recommended)

1. Install Vercel CLI:
```powershell
npm install -g vercel
```

2. Navigate to your backend directory:
```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"
```

3. Login to Vercel:
```powershell
vercel login
```

4. Deploy:
```powershell
vercel --prod
```

#### Method 2: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set the root directory to: `Makau Rentals/app`
4. Click "Deploy"

### 6. Post-Deployment Steps

After successful deployment, run these commands:

1. **Run Migrations:**
```powershell
# You'll need to do this via a script or manually connect to your database
# Create a migration script or use Railway/Render for easier DB management
```

2. **Create Superuser:**
The superuser will be auto-created from the environment variables.

3. **Test the API:**
Visit: `https://your-backend-url.vercel.app/api/accounts/` (or your health check endpoint)

### 7. Update Frontend API URL

Update your frontend (Makao-Center-V4) to use the new backend URL:

1. Open `Makao-Center-V4/src/config/api.js` (or wherever your API URL is configured)
2. Update to: `https://your-backend-url.vercel.app`

### 8. Common Issues & Solutions

**Issue: Static files not loading**
- Solution: Ensure `STATIC_ROOT` is configured and `collectstatic` runs in build script

**Issue: Database connection errors**
- Solution: Verify `DATABASE_URL` is correct and database is accessible from Vercel

**Issue: CORS errors**
- Solution: Add your frontend URL to `CORS_ALLOWED_ORIGINS` in settings.py

**Issue: File uploads failing**
- Solution: Use S3 storage for production file uploads (set `USE_S3=True`)

### 9. Alternative: Deploy to Railway or Render

If you face issues with Vercel, consider these alternatives:

**Railway** (Better for Django):
- Supports PostgreSQL database
- Easy environment variable management
- Better for long-running processes

**Render**:
- Free tier available
- Managed PostgreSQL
- Better Django support

## Testing Your Deployment

1. **Health Check:**
```powershell
curl https://your-backend-url.vercel.app/api/
```

2. **Test Authentication:**
Try logging in via your frontend

3. **Check Logs:**
```powershell
vercel logs
```

## Important Security Notes

- ✅ Set `DEBUG=False` in production
- ✅ Use strong `SECRET_KEY`
- ✅ Set `CORS_ALLOW_ALL_ORIGINS=False`
- ✅ Use HTTPS only
- ✅ Protect environment variables
- ✅ Use PostgreSQL, not SQLite
- ✅ Set up proper error logging

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs: `vercel logs`
2. Review Django logs in Vercel dashboard
3. Ensure all environment variables are set correctly
4. Verify database connectivity

---

**Your Backend URL will be:** `https://makau-rentals-v5.vercel.app` (or similar)

Remember to update this URL in your frontend configuration!
