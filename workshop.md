# Sentry Academy Workshop: Debugging Authentication Issues

## Overview
This workshop demonstrates realistic authentication bugs that occur when frontend applications consume backend APIs with inconsistent or incomplete data structures. You'll learn to identify and fix issues that commonly appear in production applications where backend changes or data inconsistencies cause frontend errors.

## Problem Description
The application has been experiencing login failures for both regular email/password authentication and SSO (Google/GitHub) authentication. The issues are caused by:

1. **Backend API returning inconsistent data structures** for different users
2. **Missing nested properties** in user profile data
3. **Frontend making assumptions** about data structure
4. **Poor error handling** on both frontend and backend
5. **Inconsistent property naming** between authentication methods

## Workshop Structure
1. **Reproduce the Issues**
2. **Analyze Backend Problems**
3. **Identify Frontend Assumptions**
4. **Implement Fixes**
5. **Best Practices**

---

## Part 1: Reproducing the Issues

### Step 1: Try Regular Login
1. Navigate to the login page: `http://localhost:5173/login`
2. Enter email: `alex@example.com` and any password
3. Click "Sign in"
4. **Expected Result**: Login may succeed but with errors in console/Sentry about missing properties

### Step 2: Try Demo User Login
1. Navigate to the login page
2. Enter email: `demo@example.com` and any password  
3. Click "Sign in"
4. **Expected Result**: Different error patterns due to different backend data structure

### Step 3: Try SSO Login
1. Navigate to the login page
2. Click "Continue with Google" or "Continue with Github"
3. **Expected Result**: SSO login failures with errors about missing social profile data

### Step 4: Check Browser Console and Sentry
- Open browser developer tools (F12)
- Look for JavaScript errors related to property access
- Check Sentry dashboard for captured exceptions

---

## Part 2: Backend API Issues

### Authentication API Endpoints

The backend provides these authentication endpoints:
- `POST /api/auth/login` - Email/password authentication
- `POST /api/auth/sso/:provider` - SSO authentication (Google/GitHub)
- `POST /api/auth/logout` - User logout

### Backend Data Structure Problems

#### Issue 1: Inconsistent User Profile Structure
**Location**: `apps/server/src/modules/auth/routes.ts`

The backend returns different data structures for different users:

```javascript
// alex@example.com user - Missing required properties
{
  id: '1',
  email: 'alex@example.com',
  name: 'Alex Johnson',
  // BUG: Missing 'preferences' object that frontend expects
  profile: {
    // BUG: Should be 'settings' but it's 'profile'
    notifications: true,
    // BUG: Missing 'privacy' object
  },
  // BUG: Missing 'metadata' object entirely
  social: {
    google: {
      // BUG: Missing 'avatar' property for SSO
      verified: true
    }
    // BUG: Missing 'github' object entirely
  }
}
```

#### Issue 2: Backend Property Access Errors
**Location**: `apps/server/src/modules/auth/routes.ts:81-85`

```javascript
// BUG: Backend tries to access missing properties
const lastLoginDate = userProfile.metadata.lastLogin; // Throws error
const emailNotifications = userProfile.settings.email.notifications; // Wrong path
```

#### Issue 3: SSO Data Structure Inconsistencies
**Location**: `apps/server/src/modules/auth/routes.ts:170-175`

```javascript
// BUG: Different structures for different providers
const socialProfile = {
  profileImage: userData.social[provider].avatar, // Fails for Google
  verified: userData.social[provider].verified,   // Fails for Google
  permissions: userData.oauth.scopes[provider].permissions // Missing nested object
};
```

---

## Part 3: Frontend Assumption Issues

### Authentication Context Problems

**Location**: `apps/frontend/src/contexts/AuthContext.tsx`

#### Issue 1: Frontend Property Access Assumptions
```javascript
// BUG: Assumes backend always returns complete data
const userTheme = response.user.preferences.theme; // Throws: Cannot read property 'theme' of undefined
const emailNotifications = response.user.settings.email.notifications; // Wrong property path
const lastLoginDate = response.user.metadata.lastLogin; // Missing metadata object
```

#### Issue 2: SSO Data Processing Assumptions
```javascript
// BUG: Assumes consistent SSO structure across providers
const socialProfile = {
  profileImage: response.user.socialProfile.profileImage, // May not exist
  verified: response.user.socialProfile.verified,
  permissions: response.user.socialProfile.permissions // Backend doesn't include this
};
```

### UI Component Issues

**Location**: `apps/frontend/src/components/layout/Navbar.tsx`

#### Issue 3: Dynamic Property Access in UI
```javascript
// BUG: Tries to access properties that may not exist from backend
const notificationStatus = (user as any).displaySettings?.showNotifications;
const privacyLevel = (user as any).displaySettings?.privacyLevel || 
                    (user as any).settings?.privacy?.level || 
                    'unknown';
```

---

## Part 4: Error Patterns to Look For

### Console Errors
1. `Cannot read property 'X' of undefined`
2. `Cannot read property 'theme' of undefined`
3. `Cannot read property 'lastLogin' of undefined`
4. `Cannot read property 'email' of undefined`
5. `Cannot read property 'avatar' of undefined`

### Sentry Error Categories
1. **Property Access Errors** - Missing nested objects
2. **Type Errors** - Unexpected data types
3. **Network Errors** - Backend API failures
4. **Authentication Errors** - Login flow failures

### Network Tab Issues
1. Backend returns `200 OK` but with incomplete data
2. Backend returns warnings about missing profile data
3. Inconsistent response structures between auth methods

---

## Part 5: Step-by-Step Fixes

### Fix 1: Backend Data Validation

**File**: `apps/server/src/modules/auth/routes.ts`

Add proper data validation and safe property access:

```javascript
// BEFORE (Broken):
const lastLoginDate = userProfile.metadata.lastLogin;
const emailNotifications = userProfile.settings.email.notifications;

// AFTER (Fixed):
const lastLoginDate = userProfile.metadata?.lastLogin || new Date().toISOString();
const emailNotifications = userProfile.settings?.email?.notifications || 
                          userProfile.profile?.notifications || 
                          false;
```

### Fix 2: Consistent Backend Response Structure

Ensure all authentication methods return consistent data:

```javascript
// Standardized response structure
const standardUserResponse = {
  ...userProfile,
  preferences: userProfile.preferences || { theme: 'light' },
  settings: {
    email: {
      notifications: userProfile.profile?.notifications || false
    },
    privacy: {
      level: 'standard'
    }
  },
  metadata: {
    lastLogin: userProfile.metadata?.lastLogin || new Date().toISOString(),
    signupDate: userProfile.metadata?.signupDate || new Date().toISOString()
  }
};
```

### Fix 3: Frontend Defensive Programming

**File**: `apps/frontend/src/contexts/AuthContext.tsx`

Add proper error handling and fallbacks:

```javascript
// BEFORE (Broken):
const userTheme = response.user.preferences.theme;
const emailNotifications = response.user.settings.email.notifications;

// AFTER (Fixed):
const userTheme = response.user.preferences?.theme || 'light';
const emailNotifications = response.user.settings?.email?.notifications || 
                          response.user.profile?.notifications || 
                          false;
```

### Fix 4: Graceful Error Handling

Add try-catch blocks with meaningful fallbacks:

```javascript
try {
  // Process complete user data
  const userProfile = processCompleteUserData(response.user);
  setUser(userProfile);
} catch (dataError) {
  // Create safe fallback profile
  const fallbackProfile = createSafeUserProfile(response.user);
  setUser(fallbackProfile);
  
  // Show user-friendly warning
  showNotification('Some profile data could not be loaded');
}
```

### Fix 5: UI Component Safety

**File**: `apps/frontend/src/components/layout/Navbar.tsx`

Use safe property access patterns:

```javascript
// BEFORE (Broken):
Last login: {user.lastLoginDate}
Privacy: {user.settings.privacy.level}

// AFTER (Fixed):
Last login: {user?.lastLoginDate || 'Recently'}
Privacy: {user?.settings?.privacy?.level || user?.displaySettings?.privacyLevel || 'Standard'}
```

---

## Part 6: Testing Your Fixes

### Verification Steps

1. **Regular Login Test**:
   - Login with `alex@example.com`
   - Verify no console errors
   - Check user profile displays correctly
   - Confirm all UI elements work

2. **Demo User Test**:
   - Login with `demo@example.com` 
   - Test different data structure handling
   - Verify fallback mechanisms work

3. **SSO Test**:
   - Try Google and GitHub SSO
   - Confirm social profile data displays
   - Check error handling for missing data

4. **Error Monitoring**:
   - Check Sentry dashboard
   - Verify errors are properly captured
   - Confirm error messages are meaningful

### Success Criteria

✅ No JavaScript console errors during login
✅ All user profile data displays correctly
✅ Missing data shows appropriate fallbacks
✅ Error messages are user-friendly
✅ Sentry captures meaningful error context
✅ Both regular and SSO login work reliably

---

## Part 7: Best Practices Learned

### Backend Best Practices

1. **Consistent API Responses**: Always return the same data structure
2. **Data Validation**: Validate and sanitize all user data
3. **Safe Property Access**: Use optional chaining and fallbacks
4. **Meaningful Errors**: Return specific error messages
5. **API Documentation**: Document expected response structures

### Frontend Best Practices

1. **Defensive Programming**: Never assume data structure
2. **Type Safety**: Use TypeScript interfaces for API responses
3. **Error Boundaries**: Implement React error boundaries
4. **Loading States**: Handle async operations gracefully
5. **User Feedback**: Show meaningful loading and error states

### Error Monitoring Best Practices

1. **Structured Logging**: Use consistent log formats
2. **Error Context**: Capture relevant state information
3. **User Impact**: Track how errors affect user experience
4. **Proactive Monitoring**: Set up alerts for critical errors
5. **Error Categorization**: Group similar errors for easier debugging

---

## Part 8: Production Readiness

### Checklist for Production

- [ ] All authentication flows tested
- [ ] Error handling covers edge cases
- [ ] User data is properly validated
- [ ] Fallback mechanisms work correctly
- [ ] Error monitoring is configured
- [ ] API responses are documented
- [ ] Type safety is enforced
- [ ] Performance impact is minimal

### Monitoring and Alerting

Set up Sentry alerts for:
- Authentication failure spikes
- Property access errors
- API response validation failures
- User profile loading issues

This workshop demonstrates realistic production issues that occur when frontend and backend systems evolve independently, causing data structure mismatches and missing property errors. 