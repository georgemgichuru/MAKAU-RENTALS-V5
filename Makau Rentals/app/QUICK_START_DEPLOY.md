# 🚀 Quick Start: Deploy Backend to Vercel

## ⚡ Fast Track (5 Minutes)

### Step 1: Generate Secret Key
```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"
python generate_secret_key.py
```
Copy the generated key - you'll need it for Vercel.

### Step 2: Set Up Database
**Option A - Vercel Postgres (Easiest)**
1. Go to https://vercel.com/dashboard
2. Click "Storage" → "Create Database" → "Postgres"
3. Copy the connection string

**Option B - Neon (Free Forever)**
1. Go to https://neon.tech
2. Sign up and create a new project
3. Copy the connection string

### Step 3: Deploy to Vercel
```powershell
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Step 4: Add Environment Variables
After deployment, go to:
**Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these (minimum required):
```
SECRET_KEY = [paste from Step 1]
DEBUG = False
DATABASE_URL = [paste from Step 2]
DJANGO_SUPERUSER_USERNAME = admin
DJANGO_SUPERUSER_EMAIL = makaorentalmanagementsystem@gmail.com
DJANGO_SUPERUSER_PASSWORD = [create a strong password]
FRONTEND_URL = https://makao-center-v4.vercel.app
CORS_ALLOW_ALL_ORIGINS = False
```

### Step 5: Redeploy
```powershell
vercel --prod
```

### Step 6: Update Frontend
In `Makao-Center-V4`, update your API base URL to your new Vercel backend URL.

## 📋 Important Files Created

✅ `vercel.json` - Vercel configuration
✅ `build_files.sh` - Build script
✅ `.vercelignore` - Files to exclude
✅ `generate_secret_key.py` - Secret key generator
✅ `.env.vercel.template` - Environment variables template
✅ `VERCEL_DEPLOYMENT_GUIDE.md` - Complete guide
✅ `deploy.ps1` - Automated deployment script

## 🎯 Alternative: Use Deployment Script

For a guided deployment:
```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"
.\deploy.ps1
```

## ⚠️ Before Deploying

### Update settings.py for Production
The following changes have already been made:
- ✅ Added `.vercel.app` to `ALLOWED_HOSTS`
- ✅ Added frontend URL to `CORS_ALLOWED_ORIGINS`
- ✅ Made `CORS_ALLOW_ALL_ORIGINS` configurable

### Must Enable PostgreSQL
In `app/settings.py`, uncomment the PostgreSQL section:

```python
# Uncomment lines 190-201
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

# Comment out lines 204-208
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'test_db.sqlite3',
#     }
# }
```

## 🔧 Common Issues

**"Module not found" errors**
- Make sure all dependencies are in `requirements.txt`

**Database connection errors**
- Verify `DATABASE_URL` is correct in Vercel settings
- Check database allows connections from Vercel IPs

**CORS errors**
- Add frontend URL to `CORS_ALLOWED_ORIGINS`
- Set `CORS_ALLOW_ALL_ORIGINS=False` in production

**Static files not loading**
- Check `collectstatic` runs in build script
- Verify `STATIC_ROOT` is configured

## 🎉 After Successful Deployment

1. **Get your backend URL** from Vercel output
2. **Update frontend** API configuration
3. **Test login** from frontend
4. **Check Vercel logs** if issues occur:
   ```powershell
   vercel logs
   ```

## 📞 Need Help?

Read the complete guide:
```powershell
cat VERCEL_DEPLOYMENT_GUIDE.md
```

Or check environment variables template:
```powershell
cat .env.vercel.template
```

## 🌟 Pro Tips

1. **Use Vercel CLI for faster deployments**
2. **Set up GitHub integration** for automatic deployments
3. **Enable S3 storage** for production file uploads
4. **Use Redis** for better performance (Celery tasks)
5. **Monitor logs** regularly: `vercel logs --follow`

---

**Your backend will be live at:** `https://your-project-name.vercel.app`

Don't forget to update this URL in your frontend! 🚀
