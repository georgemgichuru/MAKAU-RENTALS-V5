# 🚀 MIGRATION & DEPLOYMENT GUIDE

## What Was Updated

### ✅ 1. Frontend API URL Updated
**File:** `Makao-Center-V4/src/services/api.js`
- Old: `https://preaccommodatingly-nonabsorbable-joanie.ngrok-free.dev/api`
- New: `https://makau-rentals-v5.vercel.app/api`

### ✅ 2. PesaPal IPN URL Updated
**File:** `Makau Rentals/app/app/.env`
- Old: `https://preaccommodatingly-nonabsorbable-joanie.ngrok-free.dev/api/payments/callback/pesapal-ipn/`
- New: `https://makau-rentals-v5.vercel.app/api/payments/callback/pesapal-ipn/`

### ✅ 3. Database Migration Script Created
**File:** `Makau Rentals/app/migrate_to_supabase.py`

---

## 🗄️ MIGRATE YOUR DATABASE (IMPORTANT!)

### Step 1: Run Migration Script

```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"
python migrate_to_supabase.py
```

This script will:
- ✅ Backup your SQLite database automatically
- ✅ Export all data from SQLite
- ✅ Create tables in Supabase PostgreSQL
- ✅ Import all your data to Supabase
- ✅ Verify the migration was successful

### Step 2: After Successful Migration

The script will show you a summary like:
```
📊 Migration Summary:
  Users: 25
  Properties: 5
  Units: 30
  Rent Payments: 100
```

---

## 🌐 ADD ENVIRONMENT VARIABLES TO VERCEL

**CRITICAL:** You still need to add all environment variables to Vercel!

### Go to Vercel Dashboard:
https://vercel.com/george-mwangis-projects-94ba6915/makau-rentals-v5/settings/environment-variables

### Add These Variables (from your .env file):

```
DATABASE_URL=postgresql://postgres:Mw@ngi2006!00!00@db.ysuswkrlarjpzrqyoxdh.supabase.co:5432/postgres
SECRET_KEY=lvhxw0va2&_+=83rum-)8f!%oja-mi@aq^vh-($v#7e+2olsl(
DEBUG=False
DJANGO_SUPERUSER_EMAIL=georgem.gichuru@gmail.com
DJANGO_SUPERUSER_PASSWORD=Mw@ngi2006!!!
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=nyumbanirentalmanagement@gmail.com
EMAIL_HOST_PASSWORD=peej betv mpaq keqs
DEFAULT_FROM_EMAIL=nyumbanirentalmanagement@gmail.com
PESAPAL_CONSUMER_KEY=GUSAz+2YErGa340w/eov0eKyRpu5QYJu
PESAPAL_CONSUMER_SECRET=UETs03tnt5lUXBzqEatOQDwlBhs=
PESAPAL_ENV=live
PESAPAL_IPN_URL=https://makau-rentals-v5.vercel.app/api/payments/callback/pesapal-ipn/
FRONTEND_URL=https://makao-center-v4.vercel.app
CORS_ALLOW_ALL_ORIGINS=False
```

**For each variable:**
1. Click "Add New"
2. Enter Key and Value
3. Select all environments (Production, Preview, Development)
4. Click "Save"

---

## 🚀 REDEPLOY BACKEND

After adding environment variables:

```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"
vercel --prod
```

---

## 🎨 REDEPLOY FRONTEND

```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makao-Center-V4"
vercel --prod
```

---

## 🧪 TEST YOUR DEPLOYMENT

### 1. Test Backend
Visit: https://makau-rentals-v5.vercel.app/api/

### 2. Test Frontend
Visit: https://makao-center-v4.vercel.app

### 3. Test Login
Try logging in with your credentials

### 4. Test PesaPal
Try making a test payment

---

## 📋 COMPLETE DEPLOYMENT CHECKLIST

- [ ] Run database migration: `python migrate_to_supabase.py`
- [ ] Verify migration completed successfully
- [ ] Add all 18 environment variables in Vercel dashboard
- [ ] Redeploy backend: `vercel --prod`
- [ ] Redeploy frontend: `vercel --prod`
- [ ] Test backend URL
- [ ] Test frontend URL
- [ ] Test login functionality
- [ ] Test payment functionality
- [ ] Verify data appears correctly

---

## ⚠️ IMPORTANT NOTES

1. **Database Migration is Local**
   - The migration script runs on your local machine
   - It transfers data from your local SQLite to Supabase
   - Once migrated, Vercel backend will use Supabase automatically

2. **Environment Variables are Manual**
   - You MUST add them manually in Vercel dashboard
   - They are NOT uploaded with your code
   - You MUST redeploy after adding them

3. **PesaPal IPN URL**
   - Updated to use your new Vercel backend URL
   - Make sure to update this in PesaPal dashboard too if needed

4. **Backup**
   - Migration script creates automatic backup
   - Keep your SQLite backup safe until you verify everything works

---

## 🆘 IF SOMETHING GOES WRONG

### Migration Failed?
- Check your Supabase password in DATABASE_URL
- Make sure Supabase database is accessible
- Check the backup file created

### Backend Still Crashing?
- Make sure ALL environment variables are added in Vercel
- Check you redeployed after adding variables
- View logs: `vercel logs https://makau-rentals-v5.vercel.app`

### Frontend Not Connecting?
- Clear browser cache
- Check console for errors
- Verify backend is running

---

## 🎉 READY TO MIGRATE?

Run this command to start:

```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"
python migrate_to_supabase.py
```

The script will guide you through the process! 🚀
