# Testing Approve/Decline Buttons - Quick Guide

## Current Status

✅ **3 Pending Applications Found:**
1. Wesley Tenant (mpkggamer@gmail.com) - Needs deposit
2. Kimani (Aruai@mail.com) - Already living
3. Lameck Yamal (tenant@mail.com) - Already living

## How to See the Approve/Decline Buttons

### Step 1: Login as Landlord
You need to be logged in as a **landlord** account to see pending applications.

### Step 2: Navigate to Tenants Section
- Click on "Tenants" in the landlord dashboard menu

### Step 3: Click "Recently Joined Tenants" Tab
- You'll see tabs at the top: "Active Tenants", "Recently Joined Tenants", "All Tenants"
- Click on **"Recently Joined Tenants"** tab
- The tab should show a badge with the number **(3)** indicating 3 pending applications

### Step 4: View the Applications
Each pending application card will display:
- **Tenant name and email**
- **Contact information** (phone, ID number)
- **Unit/Room details**
- **Deposit status** (whether they need to pay deposit)
- **Application submission date**

### Step 5: Use the Approve/Decline Buttons
At the bottom right of each application card, you'll see two buttons:
- **Green "Approve" button** (with checkmark icon)
- **Red "Decline" button** (with X icon)

## What Happens When You Click

### Approve Button:
1. Confirmation dialog appears
2. If confirmed, the tenant account is activated
3. The tenant can now login
4. Application removed from pending list
5. Success message displayed

### Decline Button:
1. Prompt asks for optional reason
2. If confirmed, tenant account is deleted
3. Application is removed from system
4. Success message displayed

## Troubleshooting

### "I don't see the buttons"
**Check:**
- ✅ Are you logged in as a landlord?
- ✅ Are you on the "Recently Joined Tenants" tab?
- ✅ Does the tab show (3) pending applications?
- ✅ Is the frontend dev server running?

### "The tab shows (0) applications"
**Possible causes:**
1. Backend server not running
2. API endpoint error
3. You're not logged in as the correct landlord

**Check browser console:**
- Press F12 to open developer tools
- Look for API errors
- Check for logs starting with "📋 Fetching pending applications..."

### "I see an error message"
**Common errors:**
- **401 Unauthorized**: You're not logged in or session expired
- **403 Forbidden**: You're not logged in as a landlord
- **404 Not Found**: Backend server not running
- **500 Server Error**: Backend issue - check backend logs

## Testing the Full Flow

### Test Approval:
1. Click Approve on Wesley Tenant's application
2. Confirm the dialog
3. Wait for success message
4. Check that application is removed from list
5. Try to login as Wesley Tenant (mpkggamer@gmail.com)
   - Should succeed and show tenant dashboard

### Test Decline:
1. Click Decline on Kimani's application
2. Enter optional reason (or leave blank)
3. Confirm the prompt
4. Wait for success message
5. Check that application is removed from list
6. Try to login as Kimani (Aruai@mail.com)
   - Should fail with "Invalid credentials" (account deleted)

## Backend API Endpoints Being Used

- **GET** `/accounts/tenant-applications/pending/` - Fetch pending applications
- **POST** `/accounts/approve-application/{id}/` - Approve application
- **POST** `/accounts/decline-application/{id}/` - Decline application

## Files Modified

- `api.js` - Added approve/decline API methods
- `AdminTenants.jsx` - Added buttons, handlers, and data fetching

## Visual Reference

```
┌─────────────────────────────────────────────────────┐
│ [Active] [Recently Joined (3)] [All Tenants]        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────┐        │
│ │ Wesley Tenant                             │        │
│ │ Application ID: 123                       │        │
│ │ Submitted: Oct 28, 2025                   │        │
│ │                                            │        │
│ │ Contact: mpkggamer@gmail.com              │        │
│ │ Phone: ...                                 │        │
│ │                                            │        │
│ │ [View Documents] [Download]  [✓ Approve] [✗ Decline] │
│ └──────────────────────────────────────────┘        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Expected Behavior

✅ Buttons appear on the "Recently Joined Tenants" tab
✅ Green Approve button on the right side
✅ Red Decline button next to Approve
✅ Clicking shows confirmation dialog
✅ Success updates the list without page reload
✅ Tenant can login after approval
✅ Tenant account deleted after decline

## Still Not Seeing Buttons?

If you've checked everything above and still don't see the buttons:

1. **Open browser console** (F12)
2. **Look for the logs:**
   - "📋 Fetching pending applications..."
   - "✅ Pending applications response: ..."
   - "📋 Extracted applications: ..."

3. **Share the console output** if you see errors

4. **Verify you're on the right tab** - The buttons only appear on "Recently Joined Tenants" tab, NOT on "Active Tenants" or "All Tenants"

5. **Make sure backend is running** on the expected port (usually 8000)
