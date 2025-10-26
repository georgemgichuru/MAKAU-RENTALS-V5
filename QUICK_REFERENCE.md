# Quick Reference Card: User Type Validation

## 🎯 One-Line Summary
Users can now **ONLY** login to dashboards matching their account type. Attempting cross-type login shows "Invalid credentials" error.

---

## 📋 What Changed

| Component | Change | Impact |
|-----------|--------|--------|
| **Backend Serializer** | Added user_type validation | Rejects wrong type at API level |
| **Frontend Login** | Enhanced error handling | Shows clear error messages |
| **Auth Context** | Added runtime validation | Prevents token hijacking |
| **Route Protection** | Improved redirect logic | Auto-redirects to correct dashboard |

---

## 🔑 Key Features

✅ **Strict Validation** - Backend validates every login  
✅ **Clear Messages** - Users know what went wrong  
✅ **Multi-Layer** - 6 validation layers ensure security  
✅ **Auto-Redirect** - Users sent to correct dashboard  
✅ **Token Safe** - Prevents token hijacking  
✅ **No Breaking Changes** - Works with existing code  

---

## 🧪 Quick Test

### ✅ Should Work
```
1. Landlord email + Landlord password + Select "Landlord"
   → Login succeeds, access /admin

2. Tenant email + Tenant password + Select "Tenant"
   → Login succeeds, access /tenant
```

### ❌ Should Fail
```
1. Landlord email + Landlord password + Select "Tenant"
   → Error: "This account is registered as a landlord, not as a Tenant"

2. Tenant email + Tenant password + Select "Landlord"
   → Error: "This account is registered as a tenant, not as a Landlord"
```

### 🔄 Should Auto-Redirect
```
1. Login as Tenant, then type /admin in URL
   → Auto-redirects to /tenant

2. Login as Landlord, then type /tenant in URL
   → Auto-redirects to /admin
```

---

## 📁 Files to Update

### Backend
- `Makau Rentals/app/accounts/serializers.py` - MyTokenObtainPairSerializer

### Frontend
- `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx` - handleLogin
- `Makao-Center-V4/src/context/AuthContext.jsx` - checkAuthStatus & login
- `Makao-Center-V4/src/App.jsx` - ProtectedRoute
- **NEW**: `Makao-Center-V4/src/components/RoleGuard.jsx` - RoleGuard component

---

## 🔒 Security Model

```
User Login
    ↓
Backend validates: email + password ✓
Backend validates: requested type = database type ✓
    ↓
If mismatch → Return error "Invalid credentials"
If match → Return tokens
    ↓
Frontend stores tokens + userType
AuthContext validates consistency on page load
    ↓
If mismatch → Auto-logout
If match → ProtectedRoute checks role
    ↓
If role matches → Render dashboard ✓
If role doesn't match → Redirect to correct dashboard
```

---

## 📊 Error Messages

### When trying wrong account type:
```
"This account is registered as a TENANT, 
not as a LANDLORD. Please log in with the 
correct account type."
```

### When accessing wrong dashboard URL:
```
(No error - automatic redirect)
```

### When tokens are tampered with:
```
(Auto-logout on next page load)
```

---

## 🧩 Code Snippets

### Frontend - How to pass user_type

```javascript
// In LoginForm.jsx
const response = await authAPI.login({
  email: loginData.email,
  password: loginData.password,
  user_type: userType  // ← Send this!
});
```

### Backend - How to validate

```python
# In serializers.py
if requested_user_type and user.user_type != requested_user_type:
    raise serializers.ValidationError(
        f"Invalid credentials. This account is registered as a "
        f"{user.user_type}, not as a {requested_user_type}."
    )
```

### Frontend - How to check error

```javascript
if (errorMessage.toLowerCase().includes('invalid account type') || 
    errorMessage.toLowerCase().includes('not a')) {
  // User tried wrong account type
}
```

---

## 📱 User Experience

### Correct Login Path
```
1. User selects account type ✓
2. User enters email & password ✓
3. Backend validates ✓
4. Tokens returned ✓
5. User logged in ✓
6. Redirected to dashboard ✓
```

### Wrong Account Type Path
```
1. User selects WRONG account type ✗
2. User enters credentials ✓
3. Backend detects mismatch ✗
4. Error message shown ✗
5. User NOT logged in ✗
6. Prompted to try again with correct type ✗
```

---

## 🐛 Debugging Tips

### Check Console for
```
✓ "User data received: {user_type: 'landlord', ...}"
  → Good sign, user type validated

✓ "Role validation failed: User is 'tenant' but route requires 'landlord'"
  → Redirect happening correctly

✗ "User type mismatch! Stored: landlord, Actual: tenant. Logging out."
  → Token tampering detected
```

### Check Network Tab
1. Find login request
2. Look at Response
3. Should see error if type mismatch:
   ```json
   {"non_field_errors": ["Invalid credentials. This account..."]}
   ```

### Check LocalStorage
- `accessToken` - should exist after login
- `userType` - should be 'tenant' or 'landlord'
- `userData` - should match userType

---

## ✅ Deployment Checklist

- [ ] Backend serializer updated
- [ ] Backend server restarted
- [ ] Frontend LoginForm updated
- [ ] Frontend AuthContext updated
- [ ] Frontend App.jsx updated
- [ ] RoleGuard component added (optional)
- [ ] Browser cache cleared
- [ ] Test: Correct tenant login
- [ ] Test: Correct landlord login
- [ ] Test: Wrong tenant type
- [ ] Test: Wrong landlord type
- [ ] Test: Direct URL access
- [ ] Test: Token tampering

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Login works for both types | Check backend not updated, restart server |
| Error not showing | Check Network tab, verify backend response |
| Wrong dashboard showing | Clear cache, hard refresh (Ctrl+Shift+R) |
| Can access both dashboards | Check AuthContext validation, restart |
| Token tampering not caught | Check API calls, verify auth check runs |

---

## 📞 Support

**See Documentation**:
- `USER_TYPE_VALIDATION.md` - Full technical details
- `TESTING_USER_TYPE_VALIDATION.md` - Complete testing guide
- `VISUAL_FLOW_DIAGRAMS.md` - Flow diagrams
- `CHANGELOG_USER_TYPE_VALIDATION.md` - All changes explained

---

## 🎓 Key Concepts

**User Type**: Classification of user ('tenant' or 'landlord')

**Cross-Type Access**: Attempt to use one type's credentials to login as another type

**Token Hijacking**: Attacker using stolen token with modified user type

**Multi-Layer Validation**: Multiple checkpoints to ensure security

**Auto-Redirect**: Automatic redirection to appropriate dashboard based on user type

---

## 📈 What's Protected

```
✅ Login validation - Backend checks type matches
✅ Frontend errors - Clear messages shown to user
✅ Auth context - Runtime validation of consistency
✅ Route access - Role-based access control
✅ Token security - Prevents hijacking
✅ URL access - Blocks direct wrong-type URL access
```

---

**Implementation**: October 26, 2025  
**Status**: ✅ COMPLETE AND DOCUMENTED  
**Testing**: Ready to test - see TESTING_USER_TYPE_VALIDATION.md
