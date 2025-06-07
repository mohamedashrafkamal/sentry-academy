# Sentry Academy Workshop: Debugging SSO Authentication Failures

## Workshop Overview

This workshop demonstrates a realistic scenario where SSO authentication fails between frontend and backend teams due to miscommunication about API contracts. Both applications have Sentry monitoring that will automatically capture the errors for debugging.

## The Scenario

Your company is implementing SSO (Single Sign-On) authentication. The frontend team generates authentication signatures from SSO provider data, while the backend team expects to receive these signatures but the frontend has a bug where it sometimes doesn't send them properly.

**Frontend Team's Understanding:**
- Fetch user credentials from SSO providers (Google, GitHub)
- Generate login signatures from credential data
- Send signatures to backend for verification
- Handle successful authentication responses

**Backend Team's Implementation:**
- Expect login signatures in SSO requests
- Decode and validate signature format 
- Extract user data from signatures
- Return specific error codes when signatures are missing

**The Problem:**
- Frontend generates login signatures but doesn't always send them
- Backend fails when trying to decode undefined signatures
- Results in unhandled errors when `JSON.parse(atob(undefined))` is called

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
   - The backend crashes trying to decode an undefined loginSignature
   - This creates an unhandled error that Sentry will automatically capture

### Step 2: Debug Using Backend API

Let's test the backend API directly to understand what it expects:

1. **Test SSO endpoint without login signature:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/sso/google \
     -H "Content-Type: application/json" \
     -d '{
       "userData": {
         "email": "test@example.com",
         "name": "Test User",
         "provider": "google"
       }
     }'
   ```

   **Expected Response:**
   ```
   Server will crash with unhandled error:
   SyntaxError: Unexpected token 'u', "undefined" is not valid JSON
   (from JSON.parse(atob(undefined)))
   ```

2. **Test SSO endpoint with login signature:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/sso/google \
     -H "Content-Type: application/json" \
     -d '{
       "userData": {
         "email": "test@example.com",
         "name": "Test User",
         "provider": "google"
       },
       "loginSignature": "eyJzdWIiOiJnb29nbGVfdXNlcl8xMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwicHJvdmlkZXIiOiJnb29nbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTY0MDk5ODgwMCwidXNlckRhdGEiOnsiaWQiOiJnb29nbGVfdXNlcl8xMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIn19"
     }'
   ```

   **Expected Response:**
   ```json
   {
     "user": {
       "id": "google_user_123",
       "email": "test@example.com",
       "name": "Test User",
       "provider": "google"
     },
     "token": "sso-token-abc123",
     "expiresIn": "24h"
   }
   ```

### Step 3: Analyze Frontend Login Signature Generation

1. **Check the browser console** when trying SSO login
2. You'll see the frontend generates proper authentication data:
   ```
   🔐 Fetching user credentials from GOOGLE OAuth...
   ✅ Successfully retrieved user credentials from GOOGLE:
   { name: "Demo User", email: "demo.user@example.com", provider: "google" }
   
   🔑 Creating authentication token for Demo User...
   ✅ Authentication token created successfully
   ```

3. **The Problem:** The frontend generates a login signature but the current code sends it properly. To see the bug, you need to examine what happens when the signature is missing or undefined. The issue occurs during the backend's attempt to decode the signature.

### Step 4: Monitor Errors in Sentry

Sentry is already configured for both frontend and backend applications. When authentication failures occur, Sentry will automatically capture these errors.

**Frontend Errors Captured:**
- Property access errors on missing/malformed user data
- SSO authentication failures
- Login signature validation errors

**Backend Errors Captured:**
- Missing login signature decoding failures
- Invalid request format errors  
- Authentication processing errors

**To view errors in Sentry:**
1. Errors are automatically captured when they occur
2. Check your Sentry dashboard for the project
3. Look for errors related to authentication and login signatures

### Step 5: Fix the Login Signature Issue

The current code actually works correctly - it generates and sends the login signature. To create a bug scenario for the workshop, you can modify the frontend to simulate the signature not being sent:

**Create the Bug (for workshop demonstration):**

1. In `apps/frontend/src/components/auth/LoginForm.tsx`, comment out the loginSignature parameter:
   ```typescript
   // Change this:
   await ssoLogin(provider, loginSignature);
   
   // To this (creates the bug):
   await ssoLogin(provider); // Missing login signature - backend will crash
   ```

**Fix the Bug:**

1. Uncomment the loginSignature parameter to send it properly:
   ```typescript
   // Change this:
   await ssoLogin(provider); // Missing login signature
   
   // To this:
   await ssoLogin(provider, loginSignature); // Send the signature
   ```

2. Test the SSO login again - it should work!

**Alternative: Update Backend to handle missing signatures:**

1. Modify the backend to check for undefined signatures before decoding
2. This would involve adding validation in `apps/server/src/modules/auth/routes.ts`

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

### Step 5: Implement Tracing to Debug the Search Issue

Now we'll add custom tracing to help debug the API parameter mismatch. This will show you exactly what's being sent vs. what's being received.

#### Frontend Tracing Implementation

1. **Add tracing to the search API call** in `apps/frontend/src/services/api.ts`:

   ```javascript
   import * as Sentry from '@sentry/react';
   
   // Search
   search: {
     courses: (query: string) => {
       return Sentry.startSpan(
         {
           op: "http.client",
           name: "Search Courses API",
         },
         (span) => {
           // Add attributes to track the search request
           span.setAttribute("search.query", query);
           span.setAttribute("search.endpoint", "/search/courses");
           span.setAttribute("api.parameter_name", "query"); // This reveals the bug!
           span.setAttribute("api.full_url", `/search/courses?query=${encodeURIComponent(query)}`);
           
           return fetchApi<any[]>(`/search/courses?query=${encodeURIComponent(query)}`);
         }
       );
     },
   }
   ```

2. **Add tracing to the search component** in `apps/frontend/src/pages/CoursesPage.tsx`:

   ```javascript
   import * as Sentry from '@sentry/react';
   
   const getCourses = useCallback(() => {
     if (searchQuery) {
       return Sentry.startSpan(
         {
           op: "ui.search",
           name: "Course Search Request",
         },
         (span) => {
           span.setAttribute("search.term", searchQuery);
           span.setAttribute("search.component", "CoursesPage");
           span.setAttribute("search.type", "course_search");
           
           console.log(`Frontend: Searching for "${searchQuery}"`);
           return api.search.courses(searchQuery);
         }
       );
     } else {
       return api.courses.getAll();
     }
   }, [searchQuery]);
   ```

#### Backend Tracing Implementation

3. **Add tracing to the search route handler** in `apps/server/src/modules/search/routes.ts`:

   ```javascript
   import * as Sentry from '@sentry/node';
   
   searchRoutes.get('/search/courses', async (req, res) => {
     return Sentry.startSpan(
       {
         op: "http.server",
         name: "Handle Search Courses",
       },
       async (span) => {
         try {
           const { q } = req.query;
           
           // Add attributes to track what we received
           span.setAttribute("search.endpoint", "/search/courses");
           span.setAttribute("request.method", "GET");
           span.setAttribute("request.parameters", Object.keys(req.query).join(", "));
           span.setAttribute("request.expected_param", "q");
           span.setAttribute("request.received_q", q || "undefined");
           span.setAttribute("request.received_query", req.query.query || "undefined"); // This shows the mismatch!
           
           console.log('Backend received query parameters:', req.query);
           console.log('Backend looking for "q" parameter, got:', q);
           
           if (!q || typeof q !== 'string') {
             span.setAttribute("validation.failed", true);
             span.setAttribute("validation.reason", "missing_q_parameter");
             span.setAttribute("debug.actual_parameters", JSON.stringify(req.query));
             
             throw new Error(`Missing required parameter 'q'. Received parameters: ${Object.keys(req.query).join(', ')}`);
           }
           
           span.setAttribute("search.query", q);
           span.setAttribute("validation.passed", true);
           
           // Database query span
           const results = await Sentry.startSpan(
             {
               op: "db.query",
               name: "Search Courses Database",
             },
             async (dbSpan) => {
               dbSpan.setAttribute("db.operation", "search");
               dbSpan.setAttribute("search.term", q);
               
               const results = await db.select({...}).from(courses)
                 .leftJoin(users, eq(courses.instructorId, users.id))
                 .where(or(
                   ilike(courses.title, `%${q}%`),
                   ilike(courses.description, `%${q}%`)
                 ))
                 .orderBy(courses.rating)
                 .limit(50);
               
               dbSpan.setAttribute("search.results_count", results.length);
               return results;
             }
           );
           
           span.setAttribute("search.results_count", results.length);
           span.setAttribute("response.format", "structured");
           
           console.log(`Backend found ${results.length} results`);
           
           res.json({
             results,
             total: results.length,
             query: q
           });
           
         } catch (error: any) {
           span.setAttribute("error.occurred", true);
           span.setAttribute("error.message", error.message);
           span.recordException(error);
           
           console.error('Search API Error:', error.message);
           throw error;
         }
       }
     );
   });
   ```

#### Understanding the Traces

4. **After implementing tracing, search for a term** and then check your Sentry traces. You'll see a detailed waterfall showing:

   **Frontend Trace: "Course Search Request"**
   ```
   Span: ui.search - Course Search Request
   ├── search.term: "javascript"
   ├── search.component: "CoursesPage"
   └── Child Span: http.client - Search Courses API
       ├── search.query: "javascript"
       ├── api.parameter_name: "query"  ← THE BUG!
       ├── api.full_url: "/search/courses?query=javascript"
       └── duration: 250ms (failed)
   ```

   **Backend Trace: "Handle Search Courses"**
   ```
   Span: http.server - Handle Search Courses
   ├── request.parameters: "query"
   ├── request.expected_param: "q"
   ├── request.received_q: "undefined"  ← THE PROBLEM!
   ├── request.received_query: "javascript"  ← THE ACTUAL VALUE!
   ├── validation.failed: true
   ├── validation.reason: "missing_q_parameter"
   └── debug.actual_parameters: {"query":"javascript"}
   ```

5. **The "Aha!" Moment from Traces:**

   Looking at both traces side-by-side, you can immediately see:
   - **Frontend sends**: `api.parameter_name: "query"`
   - **Backend expects**: `request.expected_param: "q"`
   - **Backend receives**: `request.received_query: "javascript"` (the value is there!)
   - **Backend gets**: `request.received_q: "undefined"` (wrong parameter name!)

   **Root Cause Identified**: The frontend is sending `query=javascript` but the backend is looking for `q=javascript`.

#### Tracing-Guided Fix

6. **Fix the parameter mismatch** based on trace evidence:

   In `apps/frontend/src/services/api.ts`, change:
   ```javascript
   // BEFORE (traced and identified as the bug):
   span.setAttribute("api.parameter_name", "query");
   return fetchApi<any[]>(`/search/courses?query=${encodeURIComponent(query)}`);
   
   // AFTER (fix the parameter name):
   span.setAttribute("api.parameter_name", "q");
   return fetchApi<any[]>(`/search/courses?q=${encodeURIComponent(query)}`);
   ```

7. **Verify the fix with tracing:**

   After the fix, your traces should show:
   ```
   Frontend Trace:
   ├── api.parameter_name: "q"  ← FIXED!
   ├── api.full_url: "/search/courses?q=javascript"
   └── duration: 45ms (success)
   
   Backend Trace:
   ├── request.received_q: "javascript"  ← SUCCESS!
   ├── validation.passed: true
   ├── search.results_count: 3
   └── Child Span: db.query - Search Courses Database
       └── search.results_count: 3
   ```

#### Tracing Benefits Demonstrated

This tracing implementation shows how distributed tracing helps with API debugging:

- ✅ **Immediate Problem Identification**: See exact parameters sent vs. received
- ✅ **Root Cause Analysis**: Parameter name mismatch clearly visible
- ✅ **Performance Monitoring**: Database query timing and result counts
- ✅ **Error Context**: Full request/response context when failures occur
- ✅ **Fix Verification**: Confirm the fix works by comparing before/after traces

Without tracing, this would require manual API testing, log diving, and guesswork. With tracing, the problem and solution are immediately obvious.

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