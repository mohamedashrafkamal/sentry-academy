# Sentry Academy Workshop: Debugging JWT Authentication Failures

## Workshop Overview

This workshop demonstrates a realistic scenario where JWT token authentication fails between frontend and backend teams due to miscommunication about API contracts. Both applications have Sentry monitoring that will automatically capture the errors for debugging.

## The Scenario

Your company is implementing SSO (Single Sign-On) authentication. The frontend team believes they need to generate and send JWT tokens to authenticate SSO requests, while the backend team expects to receive these tokens but the frontend isn't actually sending them properly.

**Frontend Team's Understanding:**
- Generate JWT tokens for SSO authentication
- Send user data along with the token
- Handle successful authentication responses

**Backend Team's Implementation:**
- Expect JWT tokens in SSO requests
- Validate token format and claims
- Return specific error codes when tokens are missing

**The Problem:**
- Frontend generates tokens but doesn't send them initially
- Backend fails with "JWT_TOKEN_REQUIRED" error
- Both sides have different assumptions about the API contract

## Getting Started

1. Start the application:
   ```bash
   pnpm dev
   ```

2. Open your browser to `http://localhost:5173`

3. You should see the login form with SSO options prominently displayed

## Step 1: Experience the Authentication Error

1. **Try SSO Login:**
   - Click on any SSO provider button (Google, Microsoft, Okta)
   - Check the browser console - you'll see the frontend generates a JWT token
   - Notice the authentication fails with a backend error

2. **Observe the Error:**
   - The backend returns: `"JWT token is required for SSO authentication"`
   - This creates an unhandled error that Sentry will automatically capture

## Step 2: Debug Using Backend API

Let's test the backend API directly to understand what it expects:

1. **Test SSO endpoint without JWT token:**
   ```bash
   curl -X POST http://localhost:3000/auth/sso/google \
     -H "Content-Type: application/json" \
     -d '{
       "userData": {
         "email": "test@example.com",
         "name": "Test User",
         "provider": "google"
       },
       "code": "mock-code"
     }'
   ```

   **Expected Response:**
   ```json
   {
     "error": "JWT_TOKEN_REQUIRED",
     "message": "JWT token is required for SSO authentication",
     "details": {
       "received": "userData and code only",
       "expected": "userData, code, AND jwtToken"
     }
   }
   ```

2. **Test SSO endpoint with JWT token:**
   ```bash
   curl -X POST http://localhost:3000/auth/sso/google \
     -H "Content-Type: application/json" \
     -d '{
       "userData": {
         "email": "test@example.com",
         "name": "Test User",
         "provider": "google"
       },
       "code": "mock-code",
       "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0In0.mock"
     }'
   ```

   **Expected Response:**
   ```json
   {
     "user": {
       "id": "user_12345",
       "email": "test@example.com",
       "name": "Test User"
     },
     "token": "auth_token_67890"
   }
   ```

## Step 3: Analyze Frontend JWT Token Generation

1. **Check the browser console** when trying SSO login
2. You'll see the frontend generates a proper JWT token:
   ```
   Frontend generated JWT token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT payload: {
     "sub": "google_user_123",
     "email": "demo.user.google@example.com",
     "name": "Demo Google User",
     "provider": "google",
     "iat": 1640995200,
     "exp": 1640998800
   }
   ```

3. **The Problem:** Look at the `LoginForm.tsx` code:
   ```typescript
   // BUG: Comment out the token to simulate the miscommunication
   // await ssoLogin(provider, mockJwtToken); // This is what SHOULD happen
   
   // BUG: But instead, frontend doesn't send the token
   await ssoLogin(provider); // Missing JWT token - backend will fail
   ```

## Step 4: Monitor Errors in Sentry

Sentry is already configured for both frontend and backend applications. When authentication failures occur, Sentry will automatically capture these errors.

**Frontend Errors Captured:**
- Property access errors on missing/malformed user data
- SSO authentication failures
- JWT token validation errors

**Backend Errors Captured:**
- Missing JWT token validation failures
- Invalid request format errors
- Authentication processing errors

**To view errors in Sentry:**
1. Errors are automatically captured when they occur
2. Check your Sentry dashboard for the project
3. Look for errors related to authentication and JWT tokens

## Step 5: Fix the JWT Token Issue

**Option A: Fix Frontend (Recommended for learning):**

1. In `apps/frontend/src/components/LoginForm.tsx`, uncomment the line that sends the JWT token:
   ```typescript
   // Change this:
   await ssoLogin(provider); // Missing JWT token
   
   // To this:
   await ssoLogin(provider, mockJwtToken); // Send the token
   ```

2. Test the SSO login again - it should work!

**Option B: Update Backend to be more forgiving:**

1. Modify the backend to accept SSO requests without JWT tokens
2. This would involve changing the validation logic in `apps/server/src/modules/auth/routes.ts`

## Step 6: Additional Frontend Data Processing Errors

If you check the email/password login (by checking the checkbox and submitting the form), you'll encounter additional errors where the frontend assumes the backend returns complete user data but encounters missing properties.

These errors demonstrate:
- Property access on undefined objects
- Inconsistent API response structures
- Missing nested data handling

## Learning Outcomes

By completing this workshop, you'll understand:

1. **API Contract Mismatches:** How miscommunication between teams leads to authentication failures
2. **JWT Token Flow:** Understanding how tokens should be passed between frontend and backend
3. **Error Monitoring:** How Sentry automatically captures unhandled errors in both frontend and backend
4. **Debugging Process:** Using browser tools, API testing, and error monitoring to identify issues
5. **Real-world Scenarios:** Common authentication implementation problems in production applications

## Extended Debugging Scenarios

1. **Try different SSO providers** - Each generates different JWT payloads
2. **Test with malformed JWT tokens** - Modify the token generation to create invalid tokens
3. **Simulate network timeouts** - Add delays to see how timeouts are handled
4. **Test concurrent logins** - Multiple rapid SSO attempts to see race conditions

This workshop provides a realistic example of how authentication systems can fail in production and how monitoring tools like Sentry help identify and resolve these issues quickly. 