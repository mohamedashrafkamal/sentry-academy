# Sentry Academy Workshop: Debugging Login Issues

## Overview
This workshop demonstrates common frontend bugs that occur when making assumptions about data structure, particularly in authentication flows. You'll learn to identify and fix these issues that commonly appear in production applications.

## Problem Description
The application has been experiencing login failures for both regular email/password authentication and SSO (Google/GitHub) authentication. Users are reporting they cannot log in, and the errors appear to be related to missing or incorrectly structured user data.

## Workshop Structure
1. **Reproduce the Issues**
2. **Identify the Root Causes**
3. **Implement Fixes**
4. **Verify Solutions**
5. **Best Practices**

---

## Part 1: Reproducing the Issues

### Step 1: Try Regular Login
1. Navigate to the login page
2. Enter any email and password
3. Click "Sign in"
4. **Expected Result**: Login should fail with error: "Login failed: Unable to load user profile data"

### Step 2: Try SSO Login
1. Navigate to the login page
2. Click "Continue with Google" or "Continue with Github"
3. **Expected Result**: Login should fail with error: "Google login failed: Unable to process social profile data"

---

## Part 2: Identifying the Root Causes

### What to Look For:
- **Property Access Errors**: `Cannot read property 'X' of undefined`
- **Assumptions About Data Structure**: Code that assumes nested objects exist
- **Missing Null/Undefined Checks**: Direct property access without validation
- **Type Coercion Issues**: Using `as any` to bypass TypeScript safety

### Step 3: Examine the AuthContext Code

Open `apps/frontend/src/contexts/AuthContext.tsx` and locate the `login` function:

```typescript
// BUG: Assume user always has metadata object with required fields
const userMetadata = (loggedInUser as any).metadata;
const lastLogin = userMetadata.lastLogin; // This will throw: Cannot read property 'lastLogin' of undefined

// BUG: Assume user always has settings with nested email config
const emailSettings = (loggedInUser as any).settings.email;
const notificationEnabled = emailSettings.notifications; // This will throw: Cannot read property 'email' of undefined
```

### Step 4: Examine the SSO Login Code

In the same file, locate the `ssoLogin` function:

```typescript
// This will throw "Cannot read property 'avatar' of undefined"
socialProfile: {
  profileImage: (loggedInUser as any).social[provider].avatar,
  verified: (loggedInUser as any).social[provider].verified,
  // This will throw "Cannot read property 'scopes' of undefined"
  permissions: (loggedInUser as any).oauth.scopes[provider].permissions
},
// This will throw "Cannot read property 'map' of undefined"
linkedAccounts: (loggedInUser as any).accounts.linked.map((account: any) => ({
  provider: account.provider,
  externalId: account.id
}))
```

### Step 5: Check the User Data Structure

Look at `apps/frontend/src/types/index.ts` to see what the User type actually contains:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'instructor' | 'admin';
}
```

**Key Insight**: The User type doesn't include `metadata`, `settings`, `social`, `oauth`, or `accounts` properties that the code is trying to access!

---

## Part 3: Implementing the Fixes

### Fix 1: Safe Property Access for Regular Login

Replace the problematic code in the `login` function:

```typescript
// BEFORE (Broken):
const userMetadata = (loggedInUser as any).metadata;
const lastLogin = userMetadata.lastLogin;
const emailSettings = (loggedInUser as any).settings.email;
const notificationEnabled = emailSettings.notifications;

// AFTER (Fixed):
const userProfile = {
  ...loggedInUser,
  // Use optional chaining and provide sensible defaults
  theme: 'light', // Simple default instead of accessing non-existent preferences
  lastLoginDate: new Date().toISOString(), // Provide current date as fallback
  settings: {
    notifications: true, // Provide sensible default
    privacy: 'standard' // Provide sensible default
  }
};
```

### Fix 2: Safe Property Access for SSO Login

Replace the problematic code in the `ssoLogin` function:

```typescript
// BEFORE (Broken):
socialProfile: {
  profileImage: (loggedInUser as any).social[provider].avatar,
  verified: (loggedInUser as any).social[provider].verified,
  permissions: (loggedInUser as any).oauth.scopes[provider].permissions
},
linkedAccounts: (loggedInUser as any).accounts.linked.map((account: any) => ({
  provider: account.provider,
  externalId: account.id
}))

// AFTER (Fixed):
const ssoUserProfile = {
  ...loggedInUser,
  provider: provider,
  // Provide safe defaults for social profile data
  socialProfile: {
    profileImage: loggedInUser.avatar, // Use existing avatar
    verified: false, // Conservative default
    permissions: [] // Empty array as safe default
  },
  // Provide empty array instead of trying to map undefined
  linkedAccounts: []
};
```

### Fix 3: Remove Unnecessary Try-Catch Blocks

Since we're now using safe defaults, we can remove the try-catch blocks:

```typescript
// BEFORE (with try-catch):
try {
  const userProfile = {
    // ... problematic code
  };
  setUser(userProfile);
  setIsAuthenticated(true);
  localStorage.setItem('user', JSON.stringify(userProfile));
} catch (profileError) {
  throw new Error('Login failed: Unable to load user profile data');
}

// AFTER (clean code):
const userProfile = {
  // ... safe code with defaults
};
setUser(userProfile);
setIsAuthenticated(true);
localStorage.setItem('user', JSON.stringify(userProfile));
```

### Fix 4: Update UI Components to Handle Missing Data

In `apps/frontend/src/components/layout/Navbar.tsx`, fix the profile display:

```typescript
// BEFORE (Broken):
{(user as any)?.settings?.notifications && (
  <span className="ml-1 text-xs text-green-500">●</span>
)}

// Display metadata that doesn't exist
Last login: {(user as any)?.lastLoginDate || 'Unknown'}

// AFTER (Fixed):
{user?.settings?.notifications && (
  <span className="ml-1 text-xs text-green-500">●</span>
)}

// Show actual data or sensible fallback
Last login: {user?.lastLoginDate ? new Date(user.lastLoginDate).toLocaleDateString() : 'Recently'}
```

---

## Part 4: Complete Fixed Code

### Updated AuthContext.tsx

```typescript
const login = async (email: string, password: string): Promise<void> => {
  setIsLoading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const loggedInUser = getUserById('1');

    if (loggedInUser) {
      // Create user profile with safe defaults
      const userProfile = {
        ...loggedInUser,
        theme: 'light',
        lastLoginDate: new Date().toISOString(),
        settings: {
          notifications: true,
          privacy: 'standard'
        }
      };

      setUser(userProfile);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userProfile));
    } else {
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    console.error('Login failed', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

const ssoLogin = async (provider: string): Promise<void> => {
  setIsLoading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const loggedInUser = getUserById('1');

    if (loggedInUser) {
      const ssoUserProfile = {
        ...loggedInUser,
        provider: provider,
        socialProfile: {
          profileImage: loggedInUser.avatar,
          verified: false,
          permissions: []
        },
        linkedAccounts: []
      };

      setUser(ssoUserProfile);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(ssoUserProfile));
    } else {
      throw new Error('SSO authentication failed');
    }
  } catch (error) {
    console.error('SSO login failed', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

---

## Part 5: Testing the Fixes

### Step 6: Test Regular Login
1. Try logging in with email/password
2. **Expected Result**: Login should now succeed
3. Check the profile dropdown - should show "Recently" for last login

### Step 7: Test SSO Login
1. Try logging in with Google/GitHub
2. **Expected Result**: Login should now succeed  
3. Verify the user profile works correctly

### Step 8: Verify UI Components
1. Click on the profile dropdown
2. Check that all information displays correctly
3. Ensure no "undefined" values are shown

---

## Part 6: Best Practices & Prevention

### Key Takeaways:

1. **Never Assume Data Structure**
   - Always check if nested objects exist before accessing properties
   - Use optional chaining (`?.`) when available

2. **Provide Sensible Defaults**
   - Instead of letting properties be `undefined`, provide meaningful defaults
   - Consider what the user experience should be with missing data

3. **Avoid Type Coercion**
   - Don't use `as any` to bypass TypeScript safety
   - If you must, add proper runtime checks

4. **Handle Missing Data Gracefully**
   - UI should never show "undefined" to users
   - Provide fallback values or hide elements when data is missing

5. **Test Different Auth Flows**
   - Different authentication methods might return different data structures
   - Ensure consistent handling across all auth methods

### Code Patterns to Avoid:

```typescript
// BAD: Direct property access without checks
const value = user.settings.notifications;

// BAD: Using 'as any' without validation
const value = (user as any).settings.notifications;

// GOOD: Optional chaining with defaults
const value = user?.settings?.notifications ?? true;

// GOOD: Explicit checks
const value = user && user.settings && user.settings.notifications;
```

### Testing Checklist:

- [ ] Regular login works
- [ ] SSO login works  
- [ ] Profile dropdown displays correctly
- [ ] No "undefined" values in UI
- [ ] Error messages are user-friendly
- [ ] Console shows no errors

---

## Conclusion

This workshop demonstrated how assumptions about data structure can cause critical failures in authentication flows. The key lessons are:

1. **Validate data structure assumptions** before accessing nested properties
2. **Provide meaningful defaults** instead of allowing undefined values
3. **Test all authentication flows** to ensure consistent behavior
4. **Use TypeScript properly** instead of bypassing it with `as any`

These patterns apply to any application where you're working with dynamic data from APIs, user inputs, or external services. 