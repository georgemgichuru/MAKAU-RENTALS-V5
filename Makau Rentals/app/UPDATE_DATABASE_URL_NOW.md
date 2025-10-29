# ⚡ CRITICAL: Update DATABASE_URL in Vercel NOW

## 🎯 What You Need to Do:

### Step 1: Go to Vercel Environment Variables

Click this link: 
**https://vercel.com/george-mwangis-projects-94ba6915/makau-rentals-v5/settings/environment-variables**

### Step 2: Find DATABASE_URL

Scroll down to find the **DATABASE_URL** variable

### Step 3: Edit It

Click the **Edit** button (pencil icon) next to DATABASE_URL

### Step 4: Replace the Value

**OLD VALUE (without SSL):**
```
postgresql://postgres:I3fOIJfDwpYkU09R@db.ysuswkrlarjpzrqyoxdh.supabase.co:5432/postgres
```

**NEW VALUE (with SSL):**
```
postgresql://postgres:I3fOIJfDwpYkU09R@db.ysuswkrlarjpzrqyoxdh.supabase.co:5432/postgres?sslmode=require
```

### Step 5: Save

Click **Save**

### Step 6: Redeploy

After saving, you'll see a prompt to redeploy. Click **Redeploy** or go to:
https://vercel.com/george-mwangis-projects-94ba6915/makau-rentals-v5

Click on the latest deployment → Click the ⋯ menu → Select **Redeploy**

---

## ✅ After Redeploying (wait 30 seconds)

Test the setup endpoint:
```
https://makau-rentals-v5.vercel.app/api/setup-database/?key=makau-setup-2024
```

If you see `"status": "success"`, you're done! 🎉

If still errors, run this command to check:
```powershell
(curl "https://makau-rentals-v5.vercel.app/api/setup-database/?key=makau-setup-2024").Content
```

---

## 📸 Visual Guide:

1. Open Vercel dashboard
2. Click **Settings** tab
3. Click **Environment Variables** in left sidebar  
4. Find **DATABASE_URL**
5. Click **Edit** (pencil icon)
6. Add `?sslmode=require` to the end
7. Click **Save**
8. Click **Redeploy**

---

**The `?sslmode=require` at the end is CRITICAL for Supabase!**
