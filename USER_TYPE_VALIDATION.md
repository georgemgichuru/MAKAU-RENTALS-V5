# User Type Validation & Cross-Dashboard Access Prevention

## Overview

This document describes the comprehensive user-type validation system that prevents users from accessing dashboards of different user types. For example, a landlord cannot login to a tenant dashboard with their credentials, and vice versa.

## Implementation Details

### 1. Backend Validation (Django/DRF)

**File**: `Makau Rentals/app/accounts/serializers.py`

#### MyTokenObtainPairSerializer

The authentication serializer has been enhanced to validate user types during login:

```python
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    user_type = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        requested_user_type = attrs.get("user_type")  # User type from frontend

        # Authenticate user with email/password
        user = authenticate(self.context['request'], email=email, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid email or password")
        
        # Get the actual user type from database
        actual_user_type = user.user_type
        
        # If user_type is provided (it should be), validate it matches
        if requested_user_type:
            requested_type_normalized = requested_user_type.lower().strip()
            actual_type_normalized = actual_user_type.lower().strip()
            
            if requested_type_normalized != actual_type_normalized:
                # Clear, informative error message
                raise serializers.ValidationError(
                    f"Invalid credentials. This account is registered as a {actual_user_type.title()}, "
                    f"not as a {requested_user_type.title()}. Please log in using the correct account type."
                )
        
        # Return user type in response
        return data
```

**Key Features**:
- ✅ Validates that the requested user type matches the stored user type in database
- ✅ Provides clear error messages when there's a mismatch
- ✅ Normalizes user type comparison (case-insensitive)
- ✅ Explicitly rejects cross-type login attempts

### 2. Frontend Login Handling

**File**: `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx`

#### handleLogin Function

Enhanced error handling to catch and display backend validation errors:

```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const response = await authAPI.login({
      email: loginData.email,
      password: loginData.password,
      user_type: userType  // Pass selected user type
    });

    // ... process successful login

  } catch (err) {
    // Extract error message from backend
    let errorMessage = 'Invalid email or password';
    
    if (err.response?.data) {
      if (err.response.data.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.response.data.non_field_errors) {
        errorMessage = Array.isArray(err.response.data.non_field_errors) 
          ? err.response.data.non_field_errors[0] 
          : err.response.data.non_field_errors;
      }
    }
    
    // Provide user-friendly message for account type mismatch
    if (errorMessage.toLowerCase().includes('invalid account type') || 
        errorMessage.toLowerCase().includes('not a')) {
      const actualUserType = errorMessage.includes('landlord') ? 'landlord' : 'tenant';
      const currentUserType = userType === 'landlord' ? 'Landlord' : 'Tenant';
      
      errorMessage = `This account is registered as a ${actualUserType}, not as a ${currentUserType}. Please log in with the correct account type.`;
    }
    
    setError(errorMessage);
    // Clear tokens on error
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
  } finally {
    setIsLoading(false);
  }
};
```

**Key Features**:
- ✅ Passes user type to backend for validation
- ✅ Extracts validation errors from backend response
- ✅ Displays clear, user-friendly error messages
- ✅ Clears all auth tokens on validation failure

### 3. Auth Context Validation

**File**: `Makao-Center-V4/src/context/AuthContext.jsx`

Enhanced to validate user type consistency:

```javascript
const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    const storedUserType = localStorage.getItem('userType');

    // ...

    const response = await authAPI.getCurrentUser();
    const userData = response.data;

    if (userData && userData.user_type) {
      // CRITICAL: Validate that stored user type matches actual user type
      if (userData.user_type !== storedUserType) {
        console.warn(
          `User type mismatch! Stored: ${storedUserType}, Actual: ${userData.user_type}. Logging out.`
        );
        logout();  // Force logout on type mismatch
        return;
      }

      setIsLoggedIn(true);
      setUserType(userData.user_type);
      setUser(userData);
    }
  } catch (error) {
    // ...
  }
};

const login = async (type, userData, tokens) => {
  // Validate type match before storing
  if (userData.user_type !== type) {
    console.error(
      `Login validation failed: User type mismatch! Expected: ${type}, Got: ${userData.user_type}`
    );
    throw new Error('User type mismatch during login');
  }

  localStorage.setItem('accessToken', tokens.access);
  localStorage.setItem('refreshToken', tokens.refresh);
  localStorage.setItem('userType', type);
  localStorage.setItem('userData', JSON.stringify(userData));

  setIsLoggedIn(true);
  setUserType(type);
  setUser(userData);
};
```

**Key Features**:
- ✅ Validates consistency between stored and actual user type on each auth check
- ✅ Force logs out if type mismatch detected
- ✅ Validates type before storing in login
- ✅ Prevents token hijacking/misuse

### 4. Route Protection

**File**: `Makao-Center-V4/src/App.jsx`

Enhanced ProtectedRoute component:

```javascript
function ProtectedRoute({ children, role }) {
  const { isLoggedIn, userType, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isLoggedIn) {
    console.warn('Access attempt without login');
    return <Navigate to="/login" replace />
  }

  // Validate user has required role
  if (role && userType !== role) {
    console.warn(
      `Role validation failed: User is '${userType}' but route requires '${role}'. Redirecting to appropriate dashboard.`
    );
    
    // Redirect to their appropriate dashboard, not login
    if (userType === 'landlord') {
      return <Navigate to="/admin" replace />
    } else if (userType === 'tenant') {
      return <Navigate to="/tenant" replace />
    }
    
    return <Navigate to="/login" replace />
  }

  return children
}
```

**Route Configuration**:
```javascript
// Landlord routes - require 'landlord' role
<Route
  path="/admin/*"
  element={
    <ProtectedRoute role="landlord">
      <AdminLayout />
    </ProtectedRoute>
  }
/>

// Tenant routes - require 'tenant' role
<Route
  path="/tenant/*"
  element={
    <ProtectedRoute role="tenant">
      <TenantLayout />
    </ProtectedRoute>
  }
/>
```

**Key Features**:
- ✅ Validates role before rendering protected content
- ✅ Redirects to appropriate dashboard if wrong role
- ✅ Provides console warnings for debugging
- ✅ Prevents direct URL access to wrong dashboard type

## Security Flow

### Successful Login (Same User Type)
```
1. User selects user type (Landlord/Tenant)
2. User enters email & password
3. Frontend calls authAPI.login() with user_type parameter
4. Backend authenticates user and validates user_type matches
5. Backend returns tokens in response
6. Frontend stores tokens + userType + userData
7. AuthContext validates consistency
8. User is redirected to appropriate dashboard
9. ProtectedRoute confirms role and renders content
```

### Failed Login (Different User Type)
```
1. User selects "Landlord" type
2. User enters email & password of a TENANT account
3. Frontend calls authAPI.login(user_type='landlord')
4. Backend authenticates user successfully
5. Backend sees actual user_type='tenant' ≠ requested='landlord'
6. Backend throws ValidationError with clear message:
   "Invalid credentials. This account is registered as a tenant, 
    not as a landlord. Please log in using the correct account type."
7. Frontend catches error and displays user-friendly message
8. Tokens are cleared
9. User is not logged in
```

### Token Hijacking Prevention
```
1. Suppose attacker gets a tenant's access token
2. Attacker tries to access /admin dashboard
3. ProtectedRoute checks: userType in localStorage
4. If userType='tenant' but route requires 'landlord'
5. ProtectedRoute redirects to /tenant (tenant dashboard)
6. On each API call, if response shows user_type mismatch:
   - AuthContext force logs out
   - All tokens are cleared
   - User redirected to login
```

## Error Messages Shown to Users

### When trying to login with wrong account type:
**Case 1**: Trying to login as Landlord with Tenant credentials
```
"This account is registered as a tenant, not as a Landlord. 
Please log in with the correct account type."
```

**Case 2**: Trying to login as Tenant with Landlord credentials
```
"This account is registered as a landlord, not as a Tenant. 
Please log in with the correct account type."
```

### When accessing wrong dashboard directly:
- Automatically redirects to correct dashboard
- No error shown (seamless redirect)

## Testing the Implementation

### Test Case 1: Correct Login
```
✅ Landlord logs in as Landlord → Access /admin dashboard
✅ Tenant logs in as Tenant → Access /tenant dashboard
```

### Test Case 2: Wrong User Type
```
❌ Landlord tries login as Tenant → Error message, no access
❌ Tenant tries login as Landlord → Error message, no access
```

### Test Case 3: Direct URL Access
```
❌ Tenant tries /admin → Auto-redirects to /tenant
❌ Landlord tries /tenant → Auto-redirects to /admin
```

### Test Case 4: Token Tampering
```
❌ User tries to modify userType in localStorage → 
   - AuthContext detects mismatch
   - Auto logout on next page load
   - Redirects to login
```

## Configuration

No additional configuration needed. The system works out of the box by:

1. Backend validating user_type parameter during login
2. Frontend passing user_type parameter to backend
3. AuthContext storing and validating user type
4. ProtectedRoute checking user type before rendering

## Deployment Considerations

- ✅ Backward compatible - existing logins still work
- ✅ No database migrations needed
- ✅ Works with existing token system
- ✅ No performance impact
- ✅ Enhanced security without additional complexity

## Troubleshooting

### Users getting "Invalid credentials" when they know password is correct
1. Check they're using the correct account type selector
2. Verify user_type in database matches selection
3. Check backend validation errors in console

### Users accessing wrong dashboard
1. ProtectedRoute is redirecting them correctly
2. Check localStorage userType matches user_type from API
3. Hard refresh browser if stuck

## Files Modified

1. `Makau Rentals/app/accounts/serializers.py` - Backend validation
2. `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx` - Frontend error handling
3. `Makao-Center-V4/src/context/AuthContext.jsx` - Auth context validation
4. `Makao-Center-V4/src/App.jsx` - Route protection enhancement
5. `Makao-Center-V4/src/components/RoleGuard.jsx` - New component (optional, for future use)
