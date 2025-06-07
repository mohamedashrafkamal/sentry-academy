# Sentry Academy Workshop: JWT Authentication Debugging

Welcome to this hands-on workshop! You'll debug a realistic authentication bug involving JWT token miscommunication between frontend and backend teams. This scenario demonstrates how production authentication failures occur when teams make different assumptions about API contracts.

## 🎯 Learning Objectives

- Debug JWT token authentication flow issues
- Identify frontend/backend API contract mismatches  
- Fix authentication property access errors
- Implement proper error handling for authentication
- Add comprehensive error monitoring with Sentry

## 🛠️ Setup Instructions

1. **Start the development servers**:
   ```bash
   pnpm install
   pnpm dev
   ```

2. **Verify the servers are running**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

3. **Open browser developer tools** (F12) to monitor console errors

---

## 🔍 Step 1: Reproduce the Authentication Bug

The main authentication issue occurs with Single Sign-On (SSO) login.

### 1.1 Experience the Primary Issue (SSO Login)

1. Navigate to: http://localhost:5173/login
2. **Click "Continue with Google" or "Continue with Github"**
3. **Watch the browser console** for errors
4. **Note**: Username/password login is hidden by default

**📝 What to observe:**
- Authentication fails immediately
- Console shows JWT token generation but no successful login
- Error messages about missing JWT token requirements

### 1.2 Check Alternative Login Method

1. **Check the checkbox** "Use Username/Password Login instead"
2. This reveals the traditional email/password form
3. Try logging in with:
   - Email: `alex@example.com` 
   - Password: `any-password`
4. **Compare the different error patterns**

### 1.3 Document Your Findings

Write down what you observe:
- What happens when you click SSO buttons?
- What errors appear in the browser console?
- How do the SSO and username/password flows differ?
- What error messages do you see in the UI?

---

## 🔧 Step 2: Investigate the Backend API Failure

Let's examine what the backend expects vs. what it receives.

### 2.1 Test the SSO API Directly

Open a terminal and test the backend SSO endpoint:

```bash
# Test what the frontend is actually sending
curl -X POST http://localhost:3001/api/auth/sso/google \
  -H "Content-Type: application/json" \
  -d '{
    "userData": {
      "email": "demo.user.google@example.com",
      "name": "Demo Google User", 
      "provider": "google",
      "timestamp": "2025-01-15T10:30:00Z"
    },
    "code": "mock-oauth-code",
    "state": "mock-state"
  }'
```

**📝 Analysis Questions:**
- What error does the backend return?
- What specific field is missing?
- What does the error message tell you about backend expectations?

### 2.2 Test with JWT Token

Try the same request but include the missing JWT token:

```bash
# Test with the expected JWT token
curl -X POST http://localhost:3001/api/auth/sso/google \
  -H "Content-Type: application/json" \
  -d '{
    "userData": {
      "email": "demo.user.google@example.com",
      "name": "Demo Google User",
      "provider": "google", 
      "timestamp": "2025-01-15T10:30:00Z"
    },
    "code": "mock-oauth-code",
    "state": "mock-state",
    "jwtToken": "eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJEZW1vIFVzZXIiLCJwcm92aWRlciI6Imdvb2dsZSIsImlhdCI6MTczNzAyMjIwMCwiZXhwIjoxNzM3MDI1ODAwfQ=="
  }'
```

**📝 Analysis Questions:**
- Does this request succeed or fail differently?
- What does this tell you about JWT validation?

### 2.3 Examine Backend Code

Open `apps/server/src/modules/auth/routes.ts` and find the SSO endpoint (around line 135):

**Task**: Locate these backend issues:

1. **Missing JWT Token Validation** (around line 155):
   ```javascript
   // BUG: Backend expects JWT token that frontend doesn't send
   if (!jwtToken) {
     console.error(`JWT token missing for ${provider} SSO authentication`);
     return res.status(400).json({
       error: 'JWT_TOKEN_REQUIRED',
       message: 'JWT token is required for SSO authentication',
       // ...
     });
   }
   ```

2. **Problematic JWT Validation** (around lines 165-180):
   ```javascript
   // BUG: Try to access nested claims that don't exist
   const userRoles = jwtPayload.claims.roles; // Will fail - no 'claims' object
   const permissions = jwtPayload.permissions.scopes; // Will fail - no 'permissions' object
   ```

---

## 🐛 Step 3: Debug Frontend Token Generation

Now let's examine how the frontend handles JWT tokens.

### 3.1 Analyze Frontend SSO Flow

Open `apps/frontend/src/components/auth/LoginForm.tsx` and find the `handleSSO` function (around line 60):

**Task**: Locate these frontend issues:

1. **JWT Token Generation** (around lines 60-70):
   ```javascript
   // Generate JWT token on frontend (but won't send it correctly)
   const jwtPayload = {
     sub: 'user-123',
     email: 'user@example.com',
     // ...
   };
   
   // BUG: Frontend generates JWT but doesn't include it in the request
   const generatedJWT = btoa(JSON.stringify(jwtPayload));
   console.log('Generated JWT token (not being sent):', generatedJWT);
   ```

2. **Check the browser console** - you should see the JWT token being generated but note that it's not being sent to the backend.

### 3.2 Examine Frontend Auth Context

Open `apps/frontend/src/contexts/AuthContext.tsx` and find the `ssoLogin` function (around line 120):

**Task**: Locate these issues:

1. **Missing JWT Token in Request** (around lines 140-150):
   ```javascript
   const response = await authService.ssoLogin(provider, {
     userData: mockUserData,
     // BUG: Missing 'jwtToken' field that backend expects
     // jwtToken: generatedJWT, // <-- This is what backend expects but frontend doesn't send
     code: 'mock-oauth-code',
     state: 'mock-state'
   });
   ```

2. **Frontend assumes success** (around lines 155+):
   ```javascript
   // BUG: Try to access JWT data that won't exist due to backend error
   jwtClaims: response.user.jwtClaims.sub, // Will throw error
   tokenExpiry: response.user.jwtClaims.exp // Will throw error
   ```

---

## 🚀 Step 4: Fix the Authentication Flow

Now we'll fix the issues step by step.

### 4.1 Fix Frontend JWT Token Sending

**File**: `apps/frontend/src/components/auth/LoginForm.tsx`

**Task**: Modify the `handleSSO` function to properly pass the JWT token:

1. **Find the JWT generation code** (around line 65):
   ```javascript
   // BEFORE (Broken):
   // BUG: Frontend generates JWT but doesn't include it in the request
   const generatedJWT = btoa(JSON.stringify(jwtPayload));
   console.log('Generated JWT token (not being sent):', generatedJWT);
   
   // Automatically trigger SSO login with dummy data
   await ssoLogin(provider);
   
   // AFTER (Fixed):
   // Generate and properly send JWT token
   const generatedJWT = btoa(JSON.stringify(jwtPayload));
   console.log('Generated JWT token (being sent):', generatedJWT);
   
   // Pass the JWT token to the SSO login function
   await ssoLogin(provider, generatedJWT);
   ```

### 4.2 Fix Frontend Auth Context

**File**: `apps/frontend/src/contexts/AuthContext.tsx`

**Task**: Update the `ssoLogin` function to handle JWT tokens:

1. **Update function signature** (around line 120):
   ```javascript
   // BEFORE:
   const ssoLogin = async (provider: string): Promise<void> => {
   
   // AFTER:
   const ssoLogin = async (provider: string, jwtToken?: string): Promise<void> => {
   ```

2. **Fix the API call** (around line 150):
   ```javascript
   // BEFORE (Broken):
   const response = await authService.ssoLogin(provider, {
     userData: mockUserData,
     // BUG: Missing 'jwtToken' field that backend expects
     code: 'mock-oauth-code',
     state: 'mock-state'
   });
   
   // AFTER (Fixed):
   const response = await authService.ssoLogin(provider, {
     userData: mockUserData,
     jwtToken: jwtToken, // Include the JWT token
     code: 'mock-oauth-code',
     state: 'mock-state'
   });
   ```

3. **Fix response processing** (around line 160):
   ```javascript
   // BEFORE (Broken):
   // BUG: Try to access JWT data that won't exist due to backend error
   jwtClaims: response.user.jwtClaims.sub, // Will throw error
   tokenExpiry: response.user.jwtClaims.exp // Will throw error
   
   // AFTER (Fixed):
   // Safely access JWT claims with fallbacks
   jwtClaims: response.user.jwtClaims?.sub || 'unknown',
   tokenExpiry: response.user.jwtClaims?.exp || null
   ```

### 4.3 Update AuthContext Interface

**File**: `apps/frontend/src/contexts/AuthContext.tsx`

**Task**: Update the interface to support JWT tokens:

```javascript
// BEFORE:
interface AuthContextType {
  // ...
  ssoLogin: (provider: string) => Promise<void>;
}

// AFTER:
interface AuthContextType {
  // ...
  ssoLogin: (provider: string, jwtToken?: string) => Promise<void>;
}
```

### 4.4 Fix Backend JWT Validation

**File**: `apps/server/src/modules/auth/routes.ts`

**Task**: Improve JWT validation to handle malformed tokens:

1. **Add better JWT validation** (around line 165):
   ```javascript
   // BEFORE (Problematic):
   // BUG: Try to access nested claims that don't exist
   const userRoles = jwtPayload.claims.roles; // Will fail
   const permissions = jwtPayload.permissions.scopes; // Will fail
   
   // AFTER (Fixed):
   // Safely validate JWT structure
   const userEmail = jwtPayload.email || 'unknown';
   const userSub = jwtPayload.sub || 'unknown';
   const jwtProvider = jwtPayload.provider;
   
   // Optional validation for advanced claims
   const userRoles = jwtPayload.claims?.roles || [];
   const permissions = jwtPayload.permissions?.scopes || [];
   ```

---

## 📊 Step 5: Add Sentry Error Monitoring

Now let's add proper monitoring to catch these authentication issues.

### 5.1 Add Sentry to Backend

**File**: `apps/server/src/modules/auth/routes.ts`

**Task**: Add Sentry monitoring to authentication endpoints:

1. **Import Sentry** at the top:
   ```javascript
   import * as Sentry from '@sentry/node';
   ```

2. **Add monitoring to JWT validation**:
   ```javascript
   // Add to JWT validation failure
   if (!jwtToken) {
     Sentry.captureMessage('JWT token missing in SSO request', {
       level: 'warning',
       tags: { section: 'authentication', provider: provider },
       extra: { 
         receivedFields: Object.keys(req.body),
         expectedFields: ['jwtToken'],
         endpoint: `/sso/${provider}`
       }
     });
     console.error(`JWT token missing for ${provider} SSO authentication`);
     // ... existing error response
   }
   ```

3. **Monitor JWT validation errors**:
   ```javascript
   } catch (jwtError: any) {
     Sentry.captureException(jwtError, {
       tags: { section: 'jwt-validation', provider: provider },
       extra: { 
         jwtToken: jwtToken ? 'present' : 'missing',
         provider: provider,
         requestBody: req.body
       }
     });
     console.error('JWT validation failed:', jwtError);
     // ... existing error response
   }
   ```

### 5.2 Add Sentry to Frontend

**File**: `apps/frontend/src/contexts/AuthContext.tsx`

**Task**: Add frontend authentication monitoring:

1. **Import Sentry**:
   ```javascript
   import * as Sentry from '@sentry/react';
   ```

2. **Monitor SSO authentication attempts**:
   ```javascript
   const ssoLogin = async (provider: string, jwtToken?: string): Promise<void> => {
     // Add transaction for performance monitoring
     const transaction = Sentry.startTransaction({
       name: 'sso-authentication',
       op: 'auth',
       tags: { provider: provider }
     });
     
     try {
       // Add breadcrumb for debugging
       Sentry.addBreadcrumb({
         message: `SSO login attempt with ${provider}`,
         category: 'auth',
         data: { 
           provider: provider, 
           hasJwtToken: !!jwtToken,
           timestamp: new Date().toISOString()
         }
       });
       
       // ... existing authentication code ...
       
       transaction.setStatus('ok');
     } catch (error: any) {
       transaction.setStatus('internal_error');
       
       // Capture authentication failures with context
       Sentry.captureException(error, {
         tags: { 
           section: 'sso-authentication',
           provider: provider,
           hasJwtToken: !!jwtToken
         },
         extra: {
           errorMessage: error.message,
           provider: provider,
           jwtTokenProvided: !!jwtToken
         }
       });
       
       // ... existing error handling ...
     } finally {
       transaction.finish();
     }
   };
   ```

---

## ✅ Step 6: Test Your Fixes

Let's verify that the authentication now works correctly.

### 6.1 Test SSO Authentication Flow

1. **Clear browser cache and localStorage**
2. **Navigate to login page**: http://localhost:5173/login
3. **Click "Continue with Google" or "Continue with Github"**
4. **Verify**: 
   - No console errors
   - Successful authentication  
   - User profile displays correctly
   - JWT token is sent and validated

### 6.2 Verify Backend API

Test the backend directly with the fix:

```bash
# Test with proper JWT token (should now work)
curl -X POST http://localhost:3001/api/auth/sso/google \
  -H "Content-Type: application/json" \
  -d '{
    "userData": {
      "email": "demo.user.google@example.com",
      "name": "Demo Google User",
      "provider": "google",
      "timestamp": "2025-01-15T10:30:00Z"
    },
    "code": "mock-oauth-code", 
    "state": "mock-state",
    "jwtToken": "eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJEZW1vIFVzZXIiLCJwcm92aWRlciI6Imdvb2dsZSIsImlhdCI6MTczNzAyMjIwMCwiZXhwIjoxNzM3MDI1ODAwfQ=="
  }'
```

### 6.3 Verify Error Monitoring

1. **Check Sentry dashboard** for authentication events
2. **Test intentional failures** by sending malformed JWT tokens
3. **Verify error context** includes useful debugging information

---

## 🎓 Step 7: Understanding the Root Cause

### What Went Wrong?

1. **API Contract Mismatch**: Frontend team didn't know backend required JWT token
2. **Poor Communication**: Different assumptions about authentication flow
3. **Missing Validation**: Frontend generated JWT but didn't send it
4. **Inadequate Error Handling**: Generic error messages didn't identify the real issue
5. **No Monitoring**: No observability into authentication failures

### Production Lessons

✅ **API Contracts**: Document required fields clearly
✅ **Communication**: Ensure frontend/backend teams align on authentication flow  
✅ **Validation**: Validate all required fields are present
✅ **Error Messages**: Provide specific, actionable error messages
✅ **Monitoring**: Track authentication failures with context
✅ **Testing**: Test authentication flows end-to-end

---

## 🏆 Step 8: Wrap-up and Review

Congratulations! You've successfully debugged a realistic JWT authentication issue.

### What You've Learned

✅ **API Contract Issues**: How missing fields cause authentication failures
✅ **JWT Token Flow**: Frontend generation and backend validation 
✅ **Error Debugging**: Using specific error messages to identify issues
✅ **Team Communication**: Importance of aligned API expectations
✅ **Production Monitoring**: Capturing authentication failures with context

### Production Checklist

- [ ] Frontend sends all required authentication fields
- [ ] Backend validates JWT tokens properly
- [ ] Error messages are specific and actionable
- [ ] Authentication flows are end-to-end tested
- [ ] Monitoring captures authentication failures
- [ ] API contracts are documented and shared
- [ ] Team communication covers authentication requirements

### Key Takeaways

1. **Document API contracts** - Ensure both teams know what fields are required
2. **Validate inputs** - Check for required fields and return specific errors
3. **Monitor authentication** - Track failures with context for debugging
4. **Test end-to-end** - Verify complete authentication flows work
5. **Communicate changes** - Keep teams aligned on authentication requirements

### Next Steps

- Set up Sentry alerting for authentication failures
- Create API documentation for authentication endpoints
- Implement automated testing for authentication flows
- Establish team communication protocols for API changes

---

## 📚 Additional Resources

- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [API Design Guidelines](https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [Sentry Error Monitoring](https://docs.sentry.io/)
- [Authentication Security](https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication)

**Great job completing the workshop!** 🎉 