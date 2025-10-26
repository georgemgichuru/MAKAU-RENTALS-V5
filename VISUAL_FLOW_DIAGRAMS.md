# User Type Validation: Visual Flow Diagrams

## 1. Login Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN PAGE                               │
│  ┌─────────────────────┐      ┌──────────────────────┐         │
│  │  Select User Type   │      │  Enter Credentials   │         │
│  ├─────────────────────┤      ├──────────────────────┤         │
│  │ ○ Tenant            │      │  Email: ____         │         │
│  │ ● Landlord          │      │  Password: ____      │         │
│  └─────────────────────┘      └──────────────────────┘         │
│           │                              │                      │
│           └──────────────┬───────────────┘                      │
│                          ▼                                       │
│              [Sign In as Landlord]                              │
└─────────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │  BACKEND LOGIN       │    │  USER TYPE CHECK     │
    │                      │    │                      │
    │ 1. Auth with email   │────│ 2. Is requested      │
    │    & password        │    │    type ==           │
    │                      │    │    database type?    │
    └──────────────────────┘    └──────────────────────┘
            │                              │
        ✅  │ Valid                        │ ❌ Mismatch
            │ Credentials                 │
            │                             ▼
            │                    ┌──────────────────────┐
            │                    │  RETURN ERROR        │
            │                    │                      │
            │                    │  "Invalid           │
            │                    │   credentials. This  │
            │                    │   account is         │
            │                    │   registered as a    │
            │                    │   TENANT, not a      │
            │                    │   LANDLORD"          │
            │                    └──────────┬───────────┘
            │                              │
            ▼                              ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │  RETURN TOKENS       │    │  FRONTEND ERROR      │
    │  ✅ access_token     │    │                      │
    │  ✅ refresh_token    │    │  Display error to    │
    │  ✅ user_type        │    │  user, no login      │
    └──────────┬───────────┘    └──────────┬───────────┘
               │                           │
               ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │  FRONTEND STORE      │    │  CLEAR TOKENS        │
    │  localStorage:       │    │                      │
    │  • accessToken       │    │  localStorage.remove:│
    │  • refreshToken      │    │  • accessToken       │
    │  • userType          │    │  • refreshToken      │
    │  • userData          │    │  • userType          │
    └──────────┬───────────┘    └──────────┬───────────┘
               │                           │
               ▼                           ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │  AUTH CONTEXT        │    │  STAY ON LOGIN PAGE  │
    │  VALIDATES:          │    │                      │
    │  userData.user_type  │    │  Show error message  │
    │  ==                  │    │  "Please log in      │
    │  stored user_type    │    │   with correct       │
    │  ✅ MATCH!           │    │   account type"      │
    └──────────┬───────────┘    └──────────┬───────────┘
               │                           │
               ▼                           │
    ┌──────────────────────┐              │
    │  ROUTE PROTECTION    │              │
    │                      │              │
    │  required role:      │              │
    │  'landlord'          │              │
    │  user's role:        │              │
    │  'landlord' ✅       │              │
    │  MATCH!              │              │
    └──────────┬───────────┘              │
               │                          │
               ▼                          │
    ┌──────────────────────┐              │
    │  RENDER              │              │
    │  /admin dashboard    │              │
    │  ✅ SUCCESS!         │              │
    └──────────────────────┘              │
               │                          │
               ▼                          ▼
           ✅ LOGGED IN            ❌ NOT LOGGED IN
```

## 2. Authorization Check - Authentication Flow

```
                    USER ACCESS REQUEST
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │   ROUTE PROTECTION CHECK             │
        │   (ProtectedRoute)                   │
        └──────────────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │   IS USER LOGGED IN?                 │
        │   (localStorage.accessToken exists)  │
        └──────────────────────────────────────┘
          │                                  │
       ✅ │ YES                           ❌ │ NO
          │                                  │
          ▼                                  ▼
    ┌──────────────┐              ┌──────────────────┐
    │ CHECK ROLE   │              │ REDIRECT TO      │
    │              │              │ LOGIN            │
    │ Route req:   │              │                  │
    │ 'landlord'   │              │ window.location. │
    │              │              │ href = '/login'  │
    │ User has:    │              └──────────────────┘
    │ 'landlord' ✅│
    └──────────────┘
          │
          ▼
    ┌──────────────┐
    │ CHECK AUTH   │
    │ CONTEXT      │
    │              │
    │ Call API to  │
    │ verify token │
    │ & get user   │
    └──────────────┘
          │
          ▼
    ┌────────────────────────────────┐
    │ COMPARE USER TYPES             │
    │                                │
    │ API returns:                   │
    │ {user_type: 'landlord'}        │
    │                                │
    │ Stored:                        │
    │ localStorage.userType =        │
    │ 'landlord'                     │
    │                                │
    │ 'landlord' == 'landlord' ✅    │
    └────────────────────────────────┘
          │
          ▼
    ┌──────────────────────┐
    │ RENDER COMPONENT     │
    │                      │
    │ ✅ User can access   │
    │    protected page    │
    └──────────────────────┘

    
    TYPE MISMATCH SCENARIO:
    ═════════════════════════
    
    API returns: {user_type: 'tenant'}
    Stored: localStorage.userType = 'landlord'
    
    'tenant' ≠ 'landlord' ❌
           │
           ▼
    ┌──────────────────────┐
    │ AUTO LOGOUT          │
    │                      │
    │ Clear tokens         │
    │ Clear userType       │
    │ Redirect to login    │
    └──────────────────────┘
```

## 3. Account Type Validation - Decision Tree

```
                    LOGIN ATTEMPT
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
    ┌─────────────────┐              ┌─────────────────┐
    │ EMAIL/PASSWORD  │              │ SELECT ACCOUNT  │
    │ VALID?          │              │ TYPE: LANDLORD  │
    └────┬────────────┘              └─────────────────┘
         │                                   │
    ✅   │ YES                              │
         ▼                                   ▼
    ┌─────────────────────────────────────────────┐
    │ GET USER FROM DATABASE                      │
    │ user = User.objects.get(email=email)        │
    │ user.user_type = ?                          │
    └─────────────────┬───────────────────────────┘
                      │
        ┌─────────────┴──────────────┬──────────────┐
        │                            │              │
    ✅  ▼                        ❌  ▼          ❌   ▼
    user.user_type          user.user_type    user.user_type
    == 'landlord'           == 'tenant'       == 'admin'
    (or other)              
         │                        │                 │
         ▼                        ▼                 ▼
    ┌──────────────┐      ┌──────────────┐   ┌──────────────┐
    │ ✅ ALLOW     │      │ ❌ REJECT    │   │ ❌ REJECT    │
    │              │      │              │   │              │
    │ Return:      │      │ Return Error:│   │ Return Error:│
    │ • tokens     │      │              │   │              │
    │ • user_type  │      │ "Invalid     │   │ "Invalid     │
    │              │      │  credentials.│   │  credentials.│
    │              │      │  Account is  │   │  Account is  │
    │              │      │  tenant, not │   │  admin, not  │
    │              │      │  landlord"   │   │  landlord"   │
    └──────────────┘      └──────────────┘   └──────────────┘
         │                        │                 │
         ▼                        ▼                 ▼
    FRONTEND:              FRONTEND:           FRONTEND:
    • Store tokens         • Show error        • Show error
    • Store userType       • Don't login       • Don't login
    • Redirect to          • Clear form        • Clear form
      /admin dashboard     • Stay on login     • Stay on login
```

## 4. Multi-Layer Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LAYER 1: LOGIN FORM                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ User selects account type (Tenant/Landlord)                │   │
│  │ User enters email & password                               │   │
│  │ Frontend validates basic format                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│               LAYER 2: BACKEND AUTHENTICATION                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Receive: email, password, user_type                       │   │
│  │ • Authenticate user with email/password                     │   │
│  │ • If failed → Return "Invalid email or password"            │   │
│  │ • If success → Continue to next check                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│          LAYER 3: USER TYPE VALIDATION (NEW!)                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Get actual user_type from database                        │   │
│  │ • Compare: requested_type vs actual_type                    │   │
│  │ • If mismatch → Return ValidationError with message         │   │
│  │ • If match → Return tokens                                  │   │
│  │                                                              │   │
│  │ Error Message Example:                                       │   │
│  │ "Invalid credentials. This account is registered as a       │   │
│  │  tenant, not as a landlord. Please log in using the correct │   │
│  │  account type."                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│            LAYER 4: FRONTEND ERROR HANDLING (NEW!)                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Receive response from backend                             │   │
│  │ • Extract error from multiple possible locations            │   │
│  │ • Parse error message                                       │   │
│  │ • Display user-friendly error on login page                 │   │
│  │ • Clear all tokens                                          │   │
│  │ • Prevent redirect to dashboard                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│            LAYER 5: AUTH CONTEXT VALIDATION (NEW!)                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Store tokens + userType + userData                        │   │
│  │ • On next page load/auth check:                             │   │
│  │ • Get user data from API                                    │   │
│  │ • Compare: userData.user_type vs localStorage.userType      │   │
│  │ • If mismatch → Auto-logout + clear tokens + redirect       │   │
│  │ • If match → Continue                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│             LAYER 6: ROUTE PROTECTION (ENHANCED!)                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Check: is user logged in?                                 │   │
│  │ • Check: does user role match route requirement?            │   │
│  │ • If mismatch:                                              │   │
│  │   - If tenant trying /admin → Redirect to /tenant           │   │
│  │   - If landlord trying /tenant → Redirect to /admin         │   │
│  │ • If match → Render component                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ✅ USER CAN ACCESS
                       DASHBOARD
```

## 5. Token Hijacking Prevention Flow

```
NORMAL USER:
═════════════

  1. Login
     ├─ Send: email, password, user_type='tenant'
     └─ Receive: tokens + user_type='tenant'
  
  2. Store in localStorage
     ├─ accessToken: "eyJhbGc..."
     ├─ refreshToken: "token2..."
     ├─ userType: "tenant"
     └─ userData: {user_type: 'tenant', ...}
  
  3. Access /tenant dashboard
     ├─ ProtectedRoute checks: role='tenant' ✅
     └─ Render dashboard


ATTACKER SCENARIO:
══════════════════

  1. Attacker obtains tenant's access token
     └─ accessToken: "eyJhbGc..." (valid tenant token)
  
  2. Attacker tries to fake being landlord
     ├─ Manually edit localStorage:
     │  ├─ Set userType: "landlord" (FAKE!)
     │  └─ accessToken: remains "eyJhbGc..." (tenant token)
     └─ Try to access /admin
  
  3. ProtectedRoute check
     ├─ Checks: userType='landlord' (from localStorage)
     ├─ Route requires: 'landlord' ✅ (seems OK)
     └─ But let's continue...
  
  4. AuthContext checks on page load
     ├─ Makes API call with token
     ├─ API returns: {user_type: 'tenant', ...}
     ├─ Compare: 'tenant' ≠ 'landlord'
     ├─ MISMATCH DETECTED! ❌
     └─ Trigger auto-logout:
        ├─ Clear accessToken
        ├─ Clear refreshToken
        ├─ Clear userType
        ├─ Clear userData
        └─ Redirect to /login
  
  5. Attacker redirected to login ❌
     └─ Must authenticate properly


PROTECTION SUMMARY:
═══════════════════

Layer 1: Fake localStorage userType
         └─ Caught by AuthContext API check ✅

Layer 2: Use wrong user's token
         └─ API validates token + user_type match ✅

Layer 3: Modify API token
         └─ Token signature verification on backend ✅

Layer 4: Direct database manipulation
         └─ Would require API access (prevented by auth) ✅
```

## 6. Error Flow Diagram

```
LOGIN FAILURE SCENARIOS:
════════════════════════

┌─────────────────────────┐
│ SCENARIO 1:             │
│ Wrong Password          │
│                         │
│ Email: tenant@ex.com    │
│ Password: wrong!        │
│ Type: Tenant            │
└────────────┬────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Backend         │
    │ authenticate()  │
    │ returns: None   │
    └────────┬────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Error: "Invalid email or │
    │ password"                │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Frontend displays error  │
    │ Clear form               │
    │ Stay on login page       │
    └──────────────────────────┘


┌──────────────────────────┐
│ SCENARIO 2:              │
│ Wrong Account Type       │
│                          │
│ Email: tenant@ex.com     │
│ Password: correct!       │
│ Type: Landlord (WRONG!)  │
└────────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Backend              │
    │ authenticate()       │
    │ returns: User ✅     │
    │ (correct password)   │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────────────┐
    │ Check user_type              │
    │ Stored: 'tenant'             │
    │ Requested: 'landlord'        │
    │ MISMATCH ❌                  │
    └────────┬─────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ Error: "Invalid credentials.     │
    │ This account is registered as    │
    │ a tenant, not as a Landlord.     │
    │ Please log in using the correct  │
    │ account type."                   │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Frontend displays error  │
    │ Clear form               │
    │ Stay on login page       │
    │ User sees what went wrong!
    └──────────────────────────┘
```

---

## Key Takeaway

The implementation uses **6 layers of validation** to ensure:
1. ✅ Only correct account types can login
2. ✅ Users trying wrong type see clear error
3. ✅ Token hijacking is prevented
4. ✅ Direct URL access is blocked
5. ✅ Auto-logout if tampering detected
6. ✅ Seamless redirect to correct dashboard

**Result**: Landlords can ONLY access landlord dashboards, Tenants can ONLY access tenant dashboards. No exceptions.
