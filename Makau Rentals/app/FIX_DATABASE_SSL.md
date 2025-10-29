# 🔧 DATABASE CONNECTION FIX

## Problem Found! ❌

Your DATABASE_URL is **missing SSL configuration**. Supabase requires SSL connections.

**Current URL:**
```
postgresql://postgres:I3fOIJfDwpYkU09R@db.ysuswkrlarjpzrqyoxdh.supabase.co:5432/postgres
```

**Correct URL (with SSL):**
```
postgresql://postgres:I3fOIJfDwpYkU09R@db.ysuswkrlarjpzrqyoxdh.supabase.co:5432/postgres?sslmode=require
```

---

## 🎯 Quick Fix - Update Vercel Environment Variable

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/george-mwangis-projects-94ba6915/makau-rentals-v5/settings/environment-variables

2. Find the **DATABASE_URL** variable

3. Click **Edit**

4. Change the value to:
   ```
   postgresql://postgres:I3fOIJfDwpYkU09R@db.ysuswkrlarjpzrqyoxdh.supabase.co:5432/postgres?sslmode=require
   ```

5. Click **Save**

6. **Redeploy**: Go to Deployments > Click the ⋯ menu > Redeploy

---

### Option 2: Via Vercel CLI

Run this command:

```powershell
vercel env rm DATABASE_URL production
```

Then add it back with SSL:

```powershell
vercel env add DATABASE_URL production
```

When prompted, paste:
```
postgresql://postgres:I3fOIJfDwpYkU09R@db.ysuswkrlarjpzrqyoxdh.supabase.co:5432/postgres?sslmode=require
```

Then redeploy:
```powershell
vercel --prod
```

---

## ✅ After Updating

1. **Wait 30 seconds** for deployment to complete

2. **Test the setup endpoint again:**
   ```
   https://makau-rentals-v5.vercel.app/api/setup-database/?key=makau-setup-2024
   ```

3. **Verify it works:**
   ```
   https://makau-rentals-v5.vercel.app/api/health/
   ```

---

## 📝 Also Update Your Local .env

Update your local `.env` file too (for future reference):

```env
DATABASE_URL=postgresql://postgres:I3fOIJfDwpYkU09R@db.ysuswkrlarjpzrqyoxdh.supabase.co:5432/postgres?sslmode=require
```

---

## Why This Happens

Supabase enforces SSL for security. Without `?sslmode=require`, psycopg2 tries to connect without SSL and gets rejected, causing the empty `OperationalError`.

The `?sslmode=require` tells psycopg2 to use SSL when connecting to PostgreSQL.

---

**Once you update the DATABASE_URL, everything should work! 🎉**
