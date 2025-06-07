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

## Module 1: JWT Authentication Debugging

### Step 1: Experience the Authentication Error

1. **Try SSO Login:**
   - Click on any SSO provider button (Google, Microsoft, Okta)
   - Check the browser console - you'll see the frontend generates a JWT token
   - Notice the authentication fails with a backend error

2. **Observe the Error:**
   - The backend returns: `"JWT token is required for SSO authentication"`
   - This creates an unhandled error that Sentry will automatically capture

### Step 2: Debug Using Backend API

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

### Step 3: Analyze Frontend JWT Token Generation

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

### Step 4: Monitor Errors in Sentry

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

### Step 5: Fix the JWT Token Issue

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

### Step 6: Additional Frontend Data Processing Errors

If you check the email/password login (by checking the checkbox and submitting the form), you'll encounter additional errors where the frontend assumes the backend returns complete user data but encounters missing properties.

These errors demonstrate:
- Property access on undefined objects
- Inconsistent API response structures
- Missing nested data handling

## Module 2: Search Functionality Debugging with Tracing

### The Search Scenario

Your company has implemented a search feature for courses. The frontend team believes they should call the backend search API to get filtered results, while the backend team expects specific query parameters in a particular format. This miscommunication leads to search failures that can be debugged using tracing.

**Frontend Team's Understanding:**
- Call the backend search API when users search
- Pass search queries as parameters
- Handle search results the same way as regular course listings

**Backend Team's Implementation:**
- Expect search queries as non-empty string parameters
- Validate query parameters strictly
- Return structured search results with metadata

**The Problem:**
- Frontend calls search API but doesn't pass query parameter correctly
- Backend fails with "INVALID_SEARCH_PARAMETER" error
- Search always returns "no courses found" instead of proper results

### Step 1: Experience the Search Error

1. **Try searching for courses:**
   - Use the search box in the top navigation
   - Try searching for terms like "observability", "javascript", or "monitoring"
   - Notice that searches fail and show "no courses found"

2. **Check the browser console:**
   ```
   Frontend calling search API with query: "observability"
   Frontend assumption: passing search as parameter object
   Frontend processing search results: []
   Frontend assumption: results are directly in response array
   ```

3. **Observe the backend error:**
   - The backend returns: `"INVALID_SEARCH_PARAMETER: Search query parameter (q) is required and must be a non-empty string"`
   - This creates a searchable error in your monitoring system

### Step 2: Debug Using Backend API

Test the search API directly to understand what it expects:

1. **Test search endpoint with missing query:**
   ```bash
   curl -X GET "http://localhost:3001/api/search/courses" \
     -H "Content-Type: application/json"
   ```

   **Expected Response:**
   ```json
   {
     "error": "SEARCH_PARAMETER_ERROR",
     "message": "INVALID_SEARCH_PARAMETER: Search query parameter (q) is required and must be a non-empty string. Backend expects valid search terms for the search API endpoint.",
     "details": {
       "received": "empty/missing",
       "expected": "non-empty string",
       "endpoint": "/search/courses",
       "requiredParams": ["q"]
     }
   }
   ```

2. **Test search endpoint with proper query:**
   ```bash
   curl -X GET "http://localhost:3001/api/search/courses?q=javascript" \
     -H "Content-Type: application/json"
   ```

   **Expected Response:**
   ```json
   {
     "results": [
       {
         "id": "course_123",
         "title": "JavaScript Fundamentals",
         "description": "Learn the basics of JavaScript programming"
       }
     ],
     "total": 1,
     "query": "javascript",
     "filters": {}
   }
   ```

### Step 3: Analyze Frontend Search Implementation

1. **Check the CoursesPage implementation:**
   - Look at `apps/frontend/src/pages/CoursesPage.tsx`
   - Notice the bug in the search API call:
   ```typescript
   // TOFIX Module 2: This call is missing the actual query parameter
   // Should be: api.search.courses(searchQuery)
   // But frontend thinks they need to call it without parameters like other APIs
   return api.search.courses(''); // BUG: Empty string instead of searchQuery
   ```

2. **Check the result processing:**
   ```typescript
   // TOFIX Module 2: Should be searchResults.results instead of searchResults
   courses = Array.isArray(searchResults) ? searchResults : [];
   ```

3. **The Problem:**
   - Frontend passes empty string to search API
   - Frontend expects results as array but backend returns `{ results: [], total: 0, query: '' }`
   - Two separate bugs compound the search failure

### Step 4: Understanding the API Contract Mismatch

The search failure demonstrates a common API contract mismatch:

**Frontend Expectations:**
- Call `api.search.courses(query)` like other APIs
- Receive array of courses directly
- Same data structure as `api.courses.getAll()`

**Backend Implementation:**
- Expects `?q=searchterm` query parameter
- Returns structured response: `{ results: Course[], total: number, query: string }`
- Validates query parameter strictly

**This mismatch causes:**
- Frontend sends empty query → Backend validation error
- Backend returns structured response → Frontend processes it incorrectly
- Users see "no results" instead of helpful error messages

### Step 5: Tracing Preparation (Implementation Coming Next)

This search scenario is designed for tracing implementation where you'll add:

**Frontend Tracing:**
- Track search query parameter being sent
- Monitor API call success/failure
- Trace result processing and display

**Backend Tracing:**
- Track query parameter received
- Monitor database search execution
- Trace result formatting and response

**Custom Attributes for Tracing:**
- `search.query.sent` (frontend)
- `search.query.received` (backend)
- `search.results.count` (backend)
- `search.results.processed` (frontend)
- `search.api.endpoint` (both)
- `search.error.type` (when failures occur)

### Step 6: Fix the Search Issue

**To fix the search functionality:**

1. **Frontend Query Parameter Fix:**
   ```typescript
   // In apps/frontend/src/pages/CoursesPage.tsx
   // Change this:
   return api.search.courses(''); // BUG: Empty string
   
   // To this:
   return api.search.courses(searchQuery); // Proper query
   ```

2. **Frontend Result Processing Fix:**
   ```typescript
   // Change this:
   courses = Array.isArray(searchResults) ? searchResults : [];
   
   // To this:
   courses = searchResults?.results || [];
   ```

3. **Test the search functionality:**
   - Search for "javascript", "monitoring", or "observability"
   - Results should now display properly

## Learning Outcomes

By completing this workshop, you'll understand:

1. **API Contract Mismatches:** How miscommunication between teams leads to authentication failures
2. **JWT Token Flow:** Understanding how tokens should be passed between frontend and backend
3. **Search API Integration:** How frontend and backend teams can have different assumptions about API contracts
4. **Error Monitoring:** How Sentry automatically captures unhandled errors in both frontend and backend
5. **Debugging Process:** Using browser tools, API testing, and error monitoring to identify issues
6. **Real-world Scenarios:** Common authentication and search implementation problems in production applications
7. **Tracing Preparation:** Setting up scenarios that will benefit from distributed tracing implementation

## Extended Debugging Scenarios

1. **Try different SSO providers** - Each generates different JWT payloads
2. **Test with malformed JWT tokens** - Modify the token generation to create invalid tokens
3. **Simulate network timeouts** - Add delays to see how timeouts are handled
4. **Test concurrent logins** - Multiple rapid SSO attempts to see race conditions
5. **Search edge cases** - Empty queries, special characters, very long search terms
6. **API rate limiting** - Make multiple rapid search requests to test backend handling

This workshop provides realistic examples of how authentication and search systems can fail in production and how monitoring tools like Sentry help identify and resolve these issues quickly. The scenarios are also designed to demonstrate the value of distributed tracing in understanding complex interactions between frontend and backend services. 