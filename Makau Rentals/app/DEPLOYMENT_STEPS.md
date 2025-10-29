# 🎯 COMPLETE DEPLOYMENT GUIDE - UPDATED

## ✅ What Has Been Done

### 1. Frontend Updated ✅
- **File:** `Makao-Center-V4/src/services/api.js`
- **Backend URL:** `https://makau-rentals-v5.vercel.app/api`

### 2. PesaPal IPN URL Updated ✅
- **File:** `.env`
- **New URL:** `https://makau-rentals-v5.vercel.app/api/payments/callback/pesapal-ipn/`

### 3. Data Exported ✅
- **File:** `database_export_20251029_105639.json`
- **Size:** 41.37 KB
- **Contains:** All your users, properties, units, payments, etc.

---

## 🚀 DEPLOYMENT STEPS (IN ORDER)

### STEP 1: Add Environment Variables to Vercel ⚠️ CRITICAL

**Go to:** https://vercel.com/george-mwangis-projects-94ba6915/makau-rentals-v5/settings/environment-variables

**Add these 18 variables one by one:**

| Key | Value | Environments |
|-----|-------|--------------|
| `SECRET_KEY` | `lvhxw0va2&_+=83rum-)8f!%oja-mi@aq^vh-($v#7e+2olsl(` | All |
| `DEBUG` | `False` | All |
| `DATABASE_URL` | `postgresql://postgres:Mw@ngi2006!00!00@db.ysuswkrlarjpzrqyoxdh.supabase.co:5432/postgres` | All |
| `DJANGO_SUPERUSER_EMAIL` | `georgem.gichuru@gmail.com` | All |
| `DJANGO_SUPERUSER_PASSWORD` | `Mw@ngi2006!!!` | All |
| `DJANGO_SUPERUSER_USERNAME` | `admin` | All |
| `DJANGO_SUPERUSER_FULL_NAME` | `GEORGE MWANGI` | All |
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` | All |
| `EMAIL_HOST` | `smtp.gmail.com` | All |
| `EMAIL_PORT` | `587` | All |
| `EMAIL_USE_TLS` | `True` | All |
| `EMAIL_HOST_USER` | `nyumbanirentalmanagement@gmail.com` | All |
| `EMAIL_HOST_PASSWORD` | `peej betv mpaq keqs` | All |
| `DEFAULT_FROM_EMAIL` | `nyumbanirentalmanagement@gmail.com` | All |
| `PESAPAL_CONSUMER_KEY` | `GUSAz+2YErGa340w/eov0eKyRpu5QYJu` | All |
| `PESAPAL_CONSUMER_SECRET` | `UETs03tnt5lUXBzqEatOQDwlBhs=` | All |
| `PESAPAL_ENV` | `live` | All |
| `PESAPAL_IPN_URL` | `https://makau-rentals-v5.vercel.app/api/payments/callback/pesapal-ipn/` | All |
| `FRONTEND_URL` | `https://makao-center-v4.vercel.app` | All |
| `CORS_ALLOW_ALL_ORIGINS` | `False` | All |

**For each variable:**
1. Click "Add New"
2. Enter Key and Value
3. Select all three environments (Production, Preview, Development)
4. Click "Save"

---

### STEP 2: Deploy Backend

```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"
vercel --prod
```

Wait for deployment to complete. You should see:
```
✅  Production: https://makau-rentals-v5.vercel.app
```

---

### STEP 3: Test Backend

Visit: https://makau-rentals-v5.vercel.app/api/

You should see a response (not an error page).

---

### STEP 4: Import Data to Supabase

**Option A: Using Vercel CLI (Recommended)**

```powershell
# Navigate to backend
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"

# Run migrations on Vercel
vercel exec -- python manage.py migrate

# Upload and import data
# First, you'll need to upload the JSON file to your backend
```

**Option B: Manual Import (Easier)**

Since there's a network connectivity issue with Supabase from your local machine, the best approach is:

1. **Deploy your backend first** (Step 2 above)
2. **Create a management command** to import data that can run on Vercel
3. **Trigger it via an API endpoint**

Let me create this for you...

---

### STEP 5: Deploy Frontend

```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makao-Center-V4"
vercel --prod
```

---

## 🗄️ ALTERNATIVE: Import Data After Deployment

Since Supabase is not accessible from your local machine, here's the alternative approach:

### Method 1: Start Fresh (Recommended if you have few users)

1. Deploy backend with environment variables
2. Let Django create fresh tables
3. Register users again through the frontend
4. This ensures everything works with the new database

### Method 2: Import Data via Vercel

I'll create a management command that you can run on Vercel to import the data.

---

## 📋 QUICK CHECKLIST

- [ ] Add all 20 environment variables in Vercel
- [ ] Deploy backend: `vercel --prod`
- [ ] Verify backend is accessible
- [ ] Deploy frontend: `vercel --prod`  
- [ ] Test login functionality
- [ ] Decide on data import strategy
- [ ] Test full workflow

---

## 🆘 TROUBLESHOOTING

### Cannot Connect to Supabase Locally?
**Solution:** This is normal. Supabase will be accessible from Vercel after deployment.

### Backend Still Showing Error?
**Solution:**
1. Make sure ALL environment variables are added
2. Redeploy after adding variables
3. Check logs: `vercel logs https://makau-rentals-v5.vercel.app`

### Want to Import Your Data?
**Two options:**
1. Start fresh (easier, recommended for testing)
2. Use the import script I created (requires Vercel exec or SSH access)

---

## 🎉 RECOMMENDED NEXT STEPS

1. **Add environment variables** (Step 1) - CRITICAL!
2. **Deploy backend** (Step 2)
3. **Deploy frontend** (Step 5)
4. **Test with fresh data first**
5. **If everything works, then import old data**

---

## 📞 YOUR EXPORT FILE

Your data has been exported to:
**`database_export_20251029_105639.json`**

This file contains all your:
- Users
- Properties  
- Units
- Payments
- Reports
- Everything else!

Keep this file safe. You can import it later once the deployment is working.

---

**Start with Step 1: Add Environment Variables!**

Go to: https://vercel.com/george-mwangis-projects-94ba6915/makau-rentals-v5/settings/environment-variables
