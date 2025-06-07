# Sentry Academy Workshop: Debugging Authentication Issues

Welcome to this hands-on workshop! You'll debug realistic authentication bugs that occur when frontend applications consume backend APIs with inconsistent data structures. By the end, you'll have learned to identify, fix, and monitor authentication issues in production applications.

## 🎯 Learning Objectives

- Identify common property access errors in authentication flows
- Debug backend API data inconsistencies
- Implement defensive programming techniques
- Add error monitoring with Sentry
- Apply best practices for production authentication

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

## 🔍 Step 1: Reproduce the Authentication Issues

Let's start by experiencing the authentication problems firsthand.

### 1.1 Test Regular Login

1. Navigate to: http://localhost:5173/login
2. Enter credentials:
   - Email: `alex@example.com`
   - Password: `any-password`
3. Click "Sign in"
4. **Watch the browser console** for JavaScript errors

**📝 What to observe:**
- Does the login succeed or fail?
- What errors appear in the console?
- What happens to the user interface?

### 1.2 Test Alternative User

1. Try logging in with:
   - Email: `demo@example.com`
   - Password: `any-password`
2. **Compare the errors** with the previous login attempt

### 1.3 Test SSO Login

1. Click "Continue with Google" or "Continue with Github"
2. **Observe different error patterns** from regular login

### 1.4 Document Your Findings

Write down the error messages you see. Common patterns include:
- `Cannot read property 'X' of undefined`
- `Cannot read property 'theme' of undefined`
- `Cannot read property 'lastLogin' of undefined`

---

## 🔧 Step 2: Analyze the Backend API Issues

Let's examine what the backend is actually returning.

### 2.1 Test Backend API Directly

Open a terminal and test the backend authentication endpoint:

```bash
# Test login API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"test"}'

# Test SSO API
curl -X POST http://localhost:3001/api/auth/sso/google \
  -H "Content-Type: application/json" \
  -d '{"code":"test","state":"test"}'
```

**📝 Analysis Questions:**
- What data structure does the backend return?
- What properties are missing?
- How do different authentication methods return different structures?

### 2.2 Examine Backend Code

Open `apps/server/src/modules/auth/routes.ts` and find these problematic patterns:

**Task**: Locate the following bugs in the backend code:

1. **Missing property access** (around line 81):
   ```javascript
   const lastLoginDate = userProfile.metadata?.lastLogin; // Will throw for some users
   const emailNotifications = userProfile.settings?.email?.notifications; // Wrong property path
   ```

2. **Inconsistent user data structures** (lines 17-55):
   - `alex@example.com` user missing `preferences` object
   - `demo@example.com` user using `config` instead of `settings`

3. **SSO data structure assumptions** (around line 170):
   ```javascript
   const socialProfile = {
     profileImage: userData.social?.[provider!]?.avatar, // Will fail for Google
     verified: userData.social?.[provider!]?.verified,   // Will fail for Google  
   };
   ```

---

## 🐛 Step 3: Debug Frontend Assumptions

Now let's examine how the frontend processes the backend data.

### 3.1 Analyze Frontend Authentication Context

Open `apps/frontend/src/contexts/AuthContext.tsx` and find these problematic patterns:

**Task**: Locate these frontend bugs:

1. **Direct property access without validation** (around line 47):
   ```javascript
   const userTheme = response.user.preferences.theme; // Will throw
   const emailNotifications = response.user.settings.email.notifications; // Wrong path
   ```

2. **SSO data processing assumptions** (around line 130):
   ```javascript
   const socialProfile = {
     profileImage: response.user.socialProfile.profileImage, // May not exist
     verified: response.user.socialProfile.verified,
   };
   ```

3. **Array operations on potentially missing data** (around line 142):
   ```javascript
   const linkedAccounts = response.user.linkedAccounts.map((account: any) => ({
     // Will fail if linkedAccounts is undefined
   }));
   ```

### 3.2 Examine UI Component Issues

Open `apps/frontend/src/components/layout/Navbar.tsx` and find:

**Task**: Locate UI bugs related to property access:

1. **Dynamic property access** in helper functions
2. **Assumptions about user data structure** in the profile dropdown
3. **Missing fallback handling** for incomplete user data

---

## 🚀 Step 4: Implement the Fixes

Now we'll fix the issues step by step.

### 4.1 Fix Backend Data Validation

**File**: `apps/server/src/modules/auth/routes.ts`

**Task**: Replace the problematic property access with safe alternatives:

1. **Fix the login endpoint** (around line 81):
   ```javascript
   // BEFORE (Broken):
   const lastLoginDate = userProfile.metadata?.lastLogin; // undefined for some users
   const emailNotifications = userProfile.settings?.email?.notifications; // wrong path
   
   // AFTER (Fixed):
   const lastLoginDate = userProfile.metadata?.lastLogin || new Date().toISOString();
   const emailNotifications = userProfile.settings?.email?.notifications || 
                             userProfile.profile?.notifications || 
                             false;
   ```

2. **Standardize the response structure**:
   ```javascript
   // Add this standardization before returning the response
   const standardizedUser = {
     ...userProfile,
     preferences: userProfile.preferences || { theme: 'light' },
     settings: {
       email: {
         notifications: userProfile.profile?.notifications || userProfile.config?.email?.notifications || false
       },
       privacy: {
         level: userProfile.config?.privacy?.level || 'standard'
       }
     },
     metadata: {
       lastLogin: userProfile.metadata?.lastLogin || new Date().toISOString(),
       signupDate: userProfile.metadata?.signupDate || new Date().toISOString()
     }
   };
   ```

3. **Fix SSO endpoint** with consistent structure handling.

### 4.2 Fix Frontend Defensive Programming

**File**: `apps/frontend/src/contexts/AuthContext.tsx`

**Task**: Add safe property access and error handling:

1. **Replace direct property access** (around line 47):
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

2. **Add comprehensive error handling**:
   ```javascript
   try {
     // Process user data safely
     const userProfile = processUserDataSafely(response.user);
     setUser(userProfile);
   } catch (dataError) {
     // Create safe fallback profile
     const fallbackProfile = createSafeUserProfile(response.user);
     setUser(fallbackProfile);
     console.warn('Some profile data could not be loaded');
   }
   ```

### 4.3 Fix UI Component Safety

**File**: `apps/frontend/src/components/layout/Navbar.tsx`

**Task**: Update the helper functions to handle missing data:

1. **Fix getUserSettingsInfo function**:
   ```javascript
   const getUserSettingsInfo = () => {
     if (!user) return null;
     
     try {
       return {
         notifications: user.displaySettings?.showNotifications ?? 
                       user.settings?.email?.notifications ?? 
                       false,
         privacy: user.displaySettings?.privacyLevel || 
                 user.settings?.privacy?.level || 
                 'standard',
         theme: user.theme || user.preferences?.theme || 'light'
       };
     } catch (error) {
       console.error('Error accessing user settings:', error);
       return { notifications: false, privacy: 'standard', theme: 'light' };
     }
   };
   ```

---

## 📊 Step 5: Add Sentry Error Monitoring

Now let's add proper error monitoring to catch these issues in production.

### 5.1 Add Sentry to Backend

**File**: `apps/server/src/modules/auth/routes.ts`

**Task**: Add Sentry instrumentation:

1. **Import Sentry** at the top:
   ```javascript
   import * as Sentry from '@sentry/node';
   ```

2. **Add error tracking to login endpoint**:
   ```javascript
   authRoutes.post('/login', async (req, res) => {
     try {
       const { email, password } = req.body;
       
       // Add breadcrumb for debugging
       Sentry.addBreadcrumb({
         message: 'Login attempt',
         category: 'auth',
         data: { email: email?.substring(0, 3) + '***' }
       });
       
       // ... existing code ...
       
     } catch (error) {
       Sentry.captureException(error, {
         tags: { section: 'authentication' },
         extra: { endpoint: 'login', email: req.body.email }
       });
       // ... existing error handling ...
     }
   });
   ```

3. **Add monitoring to data processing errors**:
   ```javascript
   } catch (dataError) {
     Sentry.captureException(dataError, {
       tags: { section: 'data-processing' },
       extra: { 
         userProfile: userProfile,
         missingProperties: ['preferences', 'metadata', 'settings']
       }
     });
     // ... existing fallback logic ...
   }
   ```

### 5.2 Add Sentry to Frontend

**File**: `apps/frontend/src/contexts/AuthContext.tsx`

**Task**: Add frontend error monitoring:

1. **Import Sentry**:
   ```javascript
   import * as Sentry from '@sentry/react';
   ```

2. **Add user context and error tracking**:
   ```javascript
   const login = async (email: string, password: string): Promise<void> => {
     try {
       const response = await authService.login({ email, password });
       
       // Set user context for Sentry
       Sentry.setUser({
         id: response.user.id,
         email: response.user.email,
         username: response.user.name
       });
       
       // Add breadcrumb for successful data processing
       Sentry.addBreadcrumb({
         message: 'User data processed successfully',
         category: 'auth',
         level: 'info'
       });
       
       // ... existing code ...
       
     } catch (dataProcessingError) {
       Sentry.captureException(dataProcessingError, {
         tags: { 
           section: 'frontend-data-processing',
           authMethod: 'email-password'
         },
         extra: {
           backendResponse: response,
           missingProperties: ['preferences.theme', 'settings.email', 'metadata.lastLogin']
         }
       });
       // ... existing fallback logic ...
     }
   };
   ```

3. **Add performance monitoring**:
   ```javascript
   const loginTransaction = Sentry.startTransaction({
     name: 'user-login',
     op: 'authentication'
   });
   
   try {
     // ... login logic ...
     loginTransaction.setStatus('ok');
   } catch (error) {
     loginTransaction.setStatus('internal_error');
     throw error;
   } finally {
     loginTransaction.finish();
   }
   ```

---

## ✅ Step 6: Test Your Fixes

Let's verify that our fixes work correctly.

### 6.1 Test Authentication Flows

1. **Regular Login Test**:
   - Login with `alex@example.com`
   - Verify: No console errors
   - Verify: Profile displays correctly
   - Verify: All UI elements work

2. **Demo User Test**:
   - Login with `demo@example.com`
   - Verify: Different data structures handled correctly
   - Verify: Fallback mechanisms work

3. **SSO Test**:
   - Try Google and GitHub SSO
   - Verify: Consistent behavior across providers
   - Verify: Missing data shows appropriate fallbacks

### 6.2 Verify Error Monitoring

1. **Check Sentry Dashboard** for captured events
2. **Test intentional errors** by temporarily breaking something
3. **Verify error context** includes useful debugging information

### 6.3 Performance Testing

1. **Monitor login performance** in browser dev tools
2. **Check network requests** for API response times
3. **Verify error boundaries** don't crash the application

---

## 🎓 Step 7: Implement Best Practices

Let's add some production-ready improvements.

### 7.1 Add TypeScript Interfaces

**File**: `apps/frontend/src/types/auth.ts` (create new file)

**Task**: Define proper types for authentication:

```typescript
export interface AuthUser extends User {
  preferences?: {
    theme: 'light' | 'dark';
    notifications?: boolean;
  };
  settings?: {
    email?: {
      notifications: boolean;
    };
    privacy?: {
      level: 'public' | 'private' | 'standard';
    };
  };
  metadata?: {
    lastLogin?: string;
    signupDate?: string;
  };
  socialProfiles?: SocialProfile[];
  displaySettings?: {
    showNotifications: boolean;
    privacyLevel: string;
  };
}

export interface SocialProfile {
  provider: string;
  avatar?: string;
  verified: boolean;
}
```

### 7.2 Add Error Boundaries

**File**: `apps/frontend/src/components/ErrorBoundary.tsx` (create new file)

**Task**: Create React error boundary:

```typescript
import React from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error}>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600">
              Please refresh the page or try again later.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 7.3 Add Comprehensive Logging

**Task**: Enhance logging throughout the application:

```javascript
// Backend logging
const logger = {
  info: (message: string, extra?: any) => {
    console.log(`[INFO] ${message}`, extra);
    Sentry.addBreadcrumb({ message, level: 'info', data: extra });
  },
  error: (message: string, error?: Error, extra?: any) => {
    console.error(`[ERROR] ${message}`, error, extra);
    Sentry.captureException(error || new Error(message), { extra });
  },
  warn: (message: string, extra?: any) => {
    console.warn(`[WARN] ${message}`, extra);
    Sentry.captureMessage(message, 'warning');
  }
};
```

---

## 🏆 Step 8: Wrap-up and Review

Congratulations! You've successfully debugged and fixed authentication issues.

### What You've Learned

✅ **Property Access Errors**: How missing nested objects cause runtime failures
✅ **Defensive Programming**: Using optional chaining and fallbacks
✅ **Error Monitoring**: Implementing Sentry for production debugging  
✅ **API Consistency**: Ensuring backend responses are predictable
✅ **User Experience**: Graceful degradation when data is missing
✅ **Type Safety**: Using TypeScript to prevent structure assumptions

### Production Checklist

- [ ] All authentication flows tested
- [ ] Error handling covers edge cases  
- [ ] User data is properly validated
- [ ] Fallback mechanisms work correctly
- [ ] Error monitoring is configured
- [ ] API responses are documented
- [ ] Type safety is enforced
- [ ] Performance impact is minimal

### Key Takeaways

1. **Never assume data structure** - Always validate before accessing nested properties
2. **Provide meaningful fallbacks** - Users should never see "undefined" 
3. **Monitor production errors** - Use tools like Sentry to catch issues early
4. **Test all code paths** - Including error scenarios and missing data
5. **Document API contracts** - Ensure frontend and backend teams align on data structures

### Next Steps

- Set up Sentry alerting for authentication failures
- Create API documentation for authentication endpoints
- Implement automated testing for error scenarios
- Review other parts of the application for similar issues

---

## 📚 Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [TypeScript Optional Chaining](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining)
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [API Design Best Practices](https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design)

**Great job completing the workshop!** 🎉 