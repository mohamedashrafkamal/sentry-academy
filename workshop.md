# Sentry Academy Workshop: Debugging Real-World App Issues

## What We're Building

This workshop is all about debugging realistic app failures that happen when teams don't communicate (shocking, right?). You'll learn to use Sentry's **error monitoring**, **distributed tracing**, and **logs** to actually figure out what's broken and fix it like a pro.

## The Drama

Your company is building SSO (Single Sign-On) authentication, and surprise - the frontend and backend teams had different ideas about how it should work.

**What Frontend Thinks They're Doing:**
- Grab user credentials from SSO providers (Google, GitHub, etc.)
- Generate fancy JWT login signatures
- Send them to backend for verification
- Users log in, everyone's happy

**What Backend Actually Expects:**
- Receive login signatures in SSO requests
- Decode and validate the JWT format
- Extract user data from signatures
- Return proper error codes when things go wrong

**What Actually Happens:**
- Frontend generates signatures but sometimes forgets to send them 🤦‍♂️
- Backend tries to decode `undefined` and explodes
- `JSON.parse(atob(undefined))` becomes your new worst enemy
- Users can't log in, chaos ensues

## Getting Started

1. **Sentry is already set up** - Both apps are pre-configured, you're welcome
2. **Fire up the apps:**
   ```bash
   pnpm dev
   ```
3. **Open your browser:** `http://localhost:5173`
4. **Keep your Sentry dashboard handy** - You'll be living there for a while

## Module 1: Authentication Debugging (The Classic Frontend vs Backend Battle)

### Step 1: Break Authentication First

1. **Click Some Buttons:**
   - Hit any SSO provider button (Google, Microsoft, Okta)
   - Check the browser console - you'll see a JWT token being generated
   - Watch it fail spectacularly on the backend

2. **Enjoy the Carnage:**
   - Backend crashes trying to decode `undefined` loginSignature
   - Sentry automatically captures this beautiful disaster

### Step 2: Detective Work in Sentry

*Time to play CSI: Code Scene Investigation*

1. **Hunt Down the Error:**
   - Jump into **Issues** → **All Unresolved**
   - Look for authentication or JWT related chaos

2. **Examine the Crime Scene:**
   - **Error Title**: `SyntaxError: Unexpected token 'u', "undefined" is not valid JSON` (your new nemesis)
   - **Where It Broke**: Backend JWT decoding logic
   - **Stack Trace Analysis**: Follow the trail to `JSON.parse(atob(undefined))`
     - File path: `apps/server/src/modules/auth/routes.ts`
     - Line number where everything went sideways
     - The whole call stack that led to this mess

3. **Gather the Evidence:**
   - **Request Method**: POST (obviously)
   - **Endpoint**: `/api/auth/sso/google`
   - **User Context**: Which poor user hit this bug
   - **Environment**: Is this just dev or are we breaking prod too?
   - **Release Info**: Whose code caused this disaster?

4. **Count the Bodies:**
   - **Frequency**: How often is this ruining people's day?
   - **First Seen**: When did this start happening?
   - **Affected Users**: How many victims?
   - **Failure Rate**: What percentage of logins are exploding?

### Step 3: Add Some Actually Useful Logging

*Time to make Sentry tell us what's really happening*

1. **Add Sentry Logging to Frontend Authentication** in `apps/frontend/src/components/auth/LoginForm.tsx`:

```typescript
import * as Sentry from '@sentry/react';

const handleSSO = async (provider: string) => {
  setError('');
  setIsLoading(true);

  try {
    // Add structured logging for authentication flow
    Sentry.addBreadcrumb({
      message: `Starting SSO authentication with ${provider}`,
      level: 'info',
      data: { provider, timestamp: new Date().toISOString() }
    });

    const userCredentials = fetchSSOUserCredentials(provider);
    
    // Log successful credential generation
    Sentry.captureMessage(`SSO credentials generated for ${provider}`, {
      level: 'info',
      tags: { feature: 'authentication', provider },
      extra: { 
        hasEmail: !!userCredentials.email,
        hasName: !!userCredentials.name,
        credentialKeys: Object.keys(userCredentials)
      }
    });

    const loginSignature = createAuthenticationToken(userCredentials, provider);

    // Log token creation with debugging context
    Sentry.captureMessage(`JWT token created for SSO login`, {
      level: 'info',
      tags: { feature: 'authentication', provider, step: 'token_creation' },
      extra: {
        signatureLength: loginSignature?.length || 0,
        hasSignature: !!loginSignature,
        tokenPrefix: loginSignature?.substring(0, 10) + '...'
      }
    });

    // TOFIX Module 1: SSO Login with missing login signature
    await ssoLogin(provider, loginSignature);
    navigate('/');

  } catch (err: any) {
    // Enhanced error logging with context
    Sentry.captureException(err, {
      tags: { feature: 'authentication', provider, step: 'sso_login' },
      extra: {
        errorType: err.constructor.name,
        hasLoginSignature: !!loginSignature,
        userCredentialsAvailable: !!userCredentials
      }
    });
    
    setError(`Failed to login with ${provider} - issue with loginSignature`);
    throw err;
  } finally {
    setIsLoading(false);
  }
};
```

2. **Add Enhanced Server-Side Logging** in `apps/server/src/modules/auth/routes.ts`:

```typescript
import * as Sentry from '@sentry/node';

authRoutes.post('/sso/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { loginSignature, userData } = req.body;
    
    // Log incoming SSO request with detailed context
    Sentry.captureMessage(`SSO authentication attempt`, {
      level: 'info',
      tags: { feature: 'authentication', provider, endpoint: 'sso' },
      extra: {
        hasLoginSignature: !!loginSignature,
        hasUserData: !!userData,
        requestBodyKeys: Object.keys(req.body),
        signatureType: typeof loginSignature,
        signatureLength: loginSignature?.length || 0
      }
    });

    console.log(`SSO login attempt with ${provider}`);
    console.log('Login signature provided:', !!loginSignature);
    console.log('Signature type:', typeof loginSignature);
    console.log('Signature length:', loginSignature?.length || 0);
    
    // TOFIX Module 1: SSO Login with missing login signature
    const signaturePayload = JSON.parse(atob(loginSignature)); // This will throw when loginSignature is undefined
    
    // Log successful signature decoding
    Sentry.captureMessage(`JWT signature decoded successfully`, {
      level: 'info',
      tags: { feature: 'authentication', provider, step: 'signature_decode' },
      extra: {
        payloadKeys: Object.keys(signaturePayload),
        hasUserData: !!signaturePayload.userData,
        tokenExpiry: signaturePayload.exp
      }
    });

    // ... rest of the authentication logic

  } catch (error: any) {
    // Enhanced error capture with debugging context
    Sentry.captureException(error, {
      tags: { 
        feature: 'authentication', 
        provider: req.params.provider,
        step: 'signature_decode',
        error_type: error.constructor.name
      },
      extra: {
        hasLoginSignature: !!req.body.loginSignature,
        signatureType: typeof req.body.loginSignature,
        requestBodyKeys: Object.keys(req.body),
        stackTrace: error.stack
      }
    });
    
    console.error(`SSO login error for ${req.params.provider}:`, error.message);
    throw error;
  }
});
```

### Step 4: Analyze Stack Traces and Error Context

**🎯 Key Learning: Deep Stack Trace Analysis for Root Cause Identification**

1. **Examine the Complete Stack Trace:**
   - **Error Origin**: `JSON.parse(atob(loginSignature))` in auth routes
   - **Call Chain**: HTTP request → route handler → JWT decoding
   - **Variable State**: `loginSignature` is `undefined`
   - **Request Context**: Missing signature in request body

2. **Use Error Tags and Extra Data:**
   - **Filter by Tags**: `feature:authentication`, `provider:google`
   - **Examine Extra Data**: `hasLoginSignature: false`, `signatureType: "undefined"`
   - **Request Analysis**: Review `requestBodyKeys` to see what was actually sent

3. **Correlate Frontend and Backend Errors:**
   - **Frontend Logs**: Look for "JWT token created" messages
   - **Backend Errors**: Match timestamp with signature decode failures
   - **Context Comparison**: Compare what frontend says it sent vs what backend received

### Step 5: Implement Custom Spans for Authentication Flow

**🎯 Key Learning: Adding Production-Ready Sentry Spans with Rich Attributes**

1. **Add Comprehensive Authentication Spans** in `apps/frontend/src/components/auth/LoginForm.tsx`:

```typescript
import * as Sentry from '@sentry/react';

const handleSSO = async (provider: string) => {
  setError('');
  setIsLoading(true);

  try {
    await Sentry.startSpan(
      {
        name: 'sso.authentication',
        op: 'auth.sso',
        attributes: {
          'auth.provider': provider,
        },
      },
      async (span) => {
        const userCredentials = fetchSSOUserCredentials(provider);

        // Add user credentials details to span
        span.setAttributes({
          'auth.user.id': userCredentials.id,
          'auth.user.email': userCredentials.email,
          'auth.user.name': userCredentials.name,
          'auth.user.avatar': userCredentials.avatar,
        });

        const loginSignature = createAuthenticationToken(userCredentials, provider);

        // Add login signature status to span
        span.setAttributes({
          'auth.login_signature.defined': loginSignature !== undefined && loginSignature !== null,
        });

        // Step 3: Send credentials to our backend for verification
        // TOFIX Module 1: SSO Login with missing login signature
        await ssoLogin(provider);
      }
    );
    
    navigate('/');

  } catch (err: any) {
    Sentry.captureException(err, {
      tags: { feature: 'authentication', provider, step: 'sso_login' },
      extra: {
        hasLoginSignature: !!loginSignature,
        signatureLength: loginSignature?.length || 0,
        userCredentialsAvailable: !!userCredentials
      }
    });
    
    setError(`Failed to login with ${provider} - issue with loginSignature`);
    throw err;
  } finally {
    setIsLoading(false);
  }
  };
  ```

2. **Add Backend Authentication Spans** in `apps/server/src/modules/auth/routes.ts`:

```typescript
import * as Sentry from '@sentry/node';

authRoutes.post('/sso/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { loginSignature } = req.body;
    
    await Sentry.startSpan(
      {
        name: 'sso.authentication.backend',
        op: 'auth.sso.verify',
        attributes: {
          'auth.provider': provider,
          'auth.login_signature.provided': !!loginSignature,
          'http.method': req.method,
          'http.route': '/sso/:provider',
        },
      },
      async (span) => {
        // Add more attributes based on request data
        span.setAttributes({
          'auth.request.body_size': JSON.stringify(req.body).length,
          'auth.request.has_signature': loginSignature !== undefined,
        });

        // TOFIX Module 1: SSO Login with missing login signature
        const signaturePayload = JSON.parse(atob(loginSignature));
        
        // Add signature payload details to span
        span.setAttributes({
          'auth.signature.user_id': signaturePayload.sub || null,
          'auth.signature.email': signaturePayload.email || null,
          'auth.signature.name': signaturePayload.name || null,
          'auth.signature.provider': signaturePayload.provider || null,
          'auth.signature.has_user_data': !!(signaturePayload.userData),
        });

        // ... rest of authentication logic
        const responseData = {
          user: ssoUser,
          token: `sso-token-${createId()}`,
          expiresIn: '24h'
        };

        res.json(responseData);
      }
    );

  } catch (error: any) {
    Sentry.captureException(error, {
      tags: { operation: 'sso.authentication.backend', provider: req.params.provider },
      extra: {
        provider: req.params.provider,
        hasLoginSignature: !!req.body.loginSignature,
        requestBody: req.body,
      },
    });
    
    throw error;
  }
});
```

```typescript
authRoutes.post('/sso/:provider', async (req, res) => {
  return Sentry.startSpan({
    op: "http.server",
    name: "Handle SSO Authentication",
    attributes: {
      "http.method": "POST",
      "http.route": "/sso/:provider",
      "auth.provider": req.params.provider,
      "auth.endpoint": "sso"
    }
  }, async (serverSpan) => {
    try {
      const { provider } = req.params;
      const { loginSignature, userData } = req.body;
      
      serverSpan.setAttributes({
        "auth.request.has_signature": !!loginSignature,
        "auth.request.has_userdata": !!userData,
        "auth.request.signature_type": typeof loginSignature,
        "auth.request.body_keys": Object.keys(req.body).join(",")
      });

      // JWT decode span
      const signaturePayload = await Sentry.startSpan({
        op: "authentication.decode",
        name: "Decode JWT Signature",
        attributes: {
          "auth.provider": provider,
          "auth.step": "jwt_decode",
          "auth.signature_present": !!loginSignature
        }
      }, async (decodeSpan) => {
        try {
          if (!loginSignature) {
            decodeSpan.setAttributes({
              "auth.decode.error": "missing_signature",
              "auth.decode.signature_value": "undefined"
            });
            throw new Error("Login signature is required for SSO authentication");
          }

          const payload = JSON.parse(atob(loginSignature));
          decodeSpan.setAttributes({
            "auth.decode.success": true,
            "auth.decode.payload_keys": Object.keys(payload).join(","),
            "auth.decode.has_userdata": !!payload.userData
          });
          return payload;
        } catch (error: any) {
          decodeSpan.setAttributes({
            "auth.decode.error": error.message,
            "auth.decode.error_type": error.constructor.name
          });
          decodeSpan.recordException(error);
          throw error;
        }
      });

      // User creation span
      const ssoUser = await Sentry.startSpan({
        op: "authentication.user_creation",
        name: "Create SSO User Profile",
        attributes: {
          "auth.provider": provider,
          "auth.step": "user_creation"
        }
      }, async (userSpan) => {
        const user = {
          // ... user creation logic
        };
        userSpan.setAttributes({
          "auth.user.created": true,
          "auth.user.provider": provider,
          "auth.user.has_email": !!user.email
        });
        return user;
      });

      serverSpan.setAttributes({
        "auth.result": "success",
        "auth.user_id": ssoUser.id
      });

      res.json({
        user: ssoUser,
        token: `sso-token-${createId()}`,
        expiresIn: '24h'
      });

    } catch (error: any) {
      serverSpan.setAttributes({
        "auth.result": "failure",
        "auth.error": error.message,
        "auth.error_type": error.constructor.name
      });
      serverSpan.recordException(error);
      throw error;
    }
  });
});
```

### Step 6: Test and Validate Using Error Analysis

**🎯 Key Learning: Using Sentry Error Data to Validate Fixes**

1. **Create the Bug (for demonstration):**
   - In `apps/frontend/src/components/auth/LoginForm.tsx`, modify line ~63:
   ```typescript
   // Comment out the loginSignature parameter to create the bug:
   await ssoLogin(provider); // Missing login signature - backend will crash
   ```

2. **Monitor Error Details in Sentry:**
   - **Check Error Frequency** → Should increase with each test
   - **Examine Stack Traces** → Confirm `JSON.parse(atob(undefined))` failure
   - **Review Error Tags** → `feature:authentication`, `step:signature_decode`
   - **Analyze Extra Data** → `hasLoginSignature: false`, `signatureType: "undefined"`

3. **Fix the Bug:**
   ```typescript
   // Uncomment the loginSignature parameter:
   await ssoLogin(provider, loginSignature); // Send the signature
   ```

4. **Validate Fix Using Error Monitoring:**
   - **Error Frequency** → Should decrease to zero
   - **Success Logs** → Look for "JWT signature decoded successfully" messages
   - **Span Attributes** → `auth.result: "success"`, `auth.signature_sent: true`
   - **Performance Data** → Monitor authentication success rate

## Module 2: Search Functionality Debugging with Distributed Tracing

### The Search Scenario

Your company has implemented a search feature for courses. The frontend team believes they should call the backend search API with a `query` parameter, while the backend team expects a `q` parameter. This parameter mismatch leads to search failures that can be debugged using Sentry's distributed tracing and error analysis.

**The Problem:**
- Frontend calls search API with `?query=searchterm`
- Backend expects `?q=searchterm`
- Search always returns "no courses found" instead of proper results

### Step 1: Experience and Analyze Search Errors

1. **Try searching for courses:**
   - Use the search box in the top navigation
   - Try searching for terms like "observability", "javascript", or "monitoring"
   - Notice that searches fail and show "no courses found"

2. **Analyze Search Errors in Sentry:**
   - **Navigate to Issues** → Look for search-related errors
   - **Error Analysis**: `Missing required parameter 'q'` validation failures
   - **Stack Trace Review**: Examine parameter validation logic
   - **Error Tags**: Look for `feature:search`, `endpoint:/search/courses`

### Step 2: Add Search Logging and Error Context

**🎯 Key Learning: Enhanced Search Error Analysis**

1. **Add Frontend Search Logging** in `apps/frontend/src/pages/CoursesPage.tsx`:

```typescript
import * as Sentry from '@sentry/react';

const getCourses = useCallback(() => {
  if (searchQuery) {
    // Log search attempt with context
    Sentry.captureMessage(`User initiated course search`, {
      level: 'info',
      tags: { feature: 'search', component: 'CoursesPage' },
      extra: {
        searchTerm: searchQuery,
        searchLength: searchQuery.length,
        searchType: 'course_search',
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Frontend: Searching for "${searchQuery}"`);
    return api.search.courses(searchQuery);
  } else {
    console.log('Frontend: Loading all courses');
    return api.courses.getAll();
  }
}, [searchQuery]);
```

2. **Add Enhanced Search API Logging** in `apps/frontend/src/services/api.ts`:

```typescript
search: {
  courses: (query: string) => {
    // Log API call attempt
    Sentry.captureMessage(`Making search API call`, {
      level: 'info',
      tags: { feature: 'search', api: 'courses' },
      extra: {
        searchQuery: query,
        apiEndpoint: '/search/courses',
        parameterUsed: 'q', // This will help identify the fix
        fullUrl: `/search/courses?q=${encodeURIComponent(query)}`
      }
    });

    return fetchApi<any[]>(`/search/courses?q=${encodeURIComponent(query)}`);
  },
}
```

3. **Add Backend Search Error Logging** in `apps/server/src/modules/search/routes.ts`:

```typescript
import * as Sentry from '@sentry/node';

searchRoutes.get('/search/courses', async (req, res) => {
  try {
    const { q } = req.query;
    
    // Log search request with detailed parameter analysis
    Sentry.captureMessage(`Course search request received`, {
      level: 'info',
      tags: { feature: 'search', endpoint: 'courses' },
      extra: {
        expectedParam: 'q',
        receivedParams: Object.keys(req.query),
        parameterValues: req.query,
        hasQParam: !!q,
        qParamType: typeof q,
        qParamValue: q || 'undefined'
      }
    });

    console.log('Backend received query parameters:', req.query);
    console.log('Backend looking for "q" parameter, got:', q);
    
    if (!q || typeof q !== 'string') {
      // Enhanced error with debugging context
      const error = new Error(`Missing required parameter 'q'. Received parameters: ${Object.keys(req.query).join(', ')}`);
      
      Sentry.captureException(error, {
        tags: { 
          feature: 'search', 
          error_type: 'validation_error',
          endpoint: 'search_courses'
        },
        extra: {
          expectedParam: 'q',
          receivedParams: Object.keys(req.query),
          allQueryParams: req.query,
          validationRule: 'q parameter must be non-empty string'
        }
      });

      throw error;
    }

    // ... rest of search logic

  } catch (error: any) {
    Sentry.captureException(error, {
      tags: { feature: 'search', endpoint: 'courses' },
      extra: {
        queryParams: req.query,
        errorType: error.constructor.name,
        stackTrace: error.stack
      }
    });
    
    console.error('Search API Error:', error.message);
    throw error;
  }
});
```

### Step 3: Implement Comprehensive Search Tracing

**🎯 Key Learning: Creating Detailed Search Flow Traces with Rich Attributes**

1. **Add Search API Spans** in `apps/frontend/src/services/api.ts`:

```typescript
import * as Sentry from '@sentry/react';

const { logger } = Sentry;

export const api = {
  // ... other methods
  search: {
    courses: (query: string) => 
      Sentry.startSpan(
        {
          name: 'search.courses',
          op: 'http.client',
          attributes: {
            'search.query': query,
            'search.type': 'courses',
            'search.query_length': query.length,
            'search.query_encoded': encodeURIComponent(query),
            'http.method': 'GET',
            'http.url': `/search/courses?query=${encodeURIComponent(query)}`,
          },
        },
        () => {
          logger.info(logger.fmt`Searching courses with query: ${query}`);
          return fetchApi<any[]>(`/search/courses?query=${encodeURIComponent(query)}`);
        }
      ),
  },
  };
  ```

2. **Add Backend Search Processing Spans** in `apps/server/src/modules/search/routes.ts`:

```typescript
import * as Sentry from '@sentry/node';

const { logger } = Sentry;

searchRoutes.get('/search/courses', async (req, res) => {
  try {
    const { q } = req.query;

    await Sentry.startSpan(
      {
        name: 'search.courses.server',
        op: 'db.search',
        attributes: {
          'search.query': typeof q === 'string' ? q : String(q || ''),
        },
      },
      async (span) => {
        logger.info(logger.fmt`Backend received query parameters: ${q}`);
        
        // Add query validation attributes
        span.setAttributes({
          'search.query_provided': !!q,
        });
        
        // Realistic API validation - backend expects 'q' parameter
        if (!q || typeof q !== 'string') {
          // This will throw when frontend sends 'query' instead of 'q'
          throw new Error(`Missing required parameter 'q'. Received parameters: ${Object.keys(req.query).join(', ')}`);
        }

        logger.info(logger.fmt`Backend searching for: "${q}"`);

        // Simple search implementation
        const results = await db
          .select({
            id: courses.id,
            title: courses.title,
            slug: courses.slug,
            description: courses.description,
            instructor: users.name,
            // ... other fields
          })
          .from(courses)
          .leftJoin(users, eq(courses.instructorId, users.id))
          .where(
            or(
              ilike(courses.title, `%${q}%`),
              ilike(courses.description, `%${q}%`)
            )
          )
          .orderBy(courses.rating)
          .limit(50);

        // Add search results attributes
        span.setAttributes({
          'search.results_count': results.length,
          'search.results_found': results.length > 0,
          'search.query_successful': true,
        });

        logger.info(logger.fmt`Backend found ${results.length} results for query: "${q}"`);
        
        res.json({
          results,
          total: results.length,
          query: q
        });
      }
    );

  } catch (error: any) {
    Sentry.captureException(error, {
      tags: {
        operation: 'search.courses.server',
        query: req.query.q as string || 'undefined',
      },
      extra: {
        queryParameters: req.query,
        searchQuery: req.query.q,
        receivedParameters: Object.keys(req.query),
        requestUrl: req.url,
      },
    });
    
    logger.error(logger.fmt`Search API Error for query "${req.query.q}": ${error.message}`);
    throw new Error(error.message);
  }
});
```

```typescript
searchRoutes.get('/search/courses', async (req, res) => {
  return Sentry.startSpan({
    op: "http.server",
    name: "Handle Course Search Request",
    attributes: {
      "http.method": "GET",
      "http.route": "/search/courses",
      "search.endpoint": "courses",
      "request.query_params": Object.keys(req.query).join(","),
      "request.expected_param": "q"
    }
  }, async (serverSpan) => {
    try {
      const { q } = req.query;
      
      // Parameter validation span
      await Sentry.startSpan({
        op: "search.validation",
        name: "Validate Search Parameters",
        attributes: {
          "validation.param_name": "q",
          "validation.param_received": !!q,
          "validation.param_type": typeof q,
          "validation.param_value": q || "undefined"
        }
      }, async (validationSpan) => {
        if (!q || typeof q !== 'string') {
          validationSpan.setAttributes({
            "validation.result": "failed",
            "validation.error": "missing_q_parameter",
            "validation.received_params": Object.keys(req.query).join(",")
          });
          throw new Error(`Missing required parameter 'q'. Received: ${Object.keys(req.query).join(', ')}`);
        }
        
        validationSpan.setAttributes({
          "validation.result": "passed",
          "validation.search_term": q
        });
      });

      // Database search span
      const results = await Sentry.startSpan({
        op: "db.query",
        name: "Search Database for Courses",
        attributes: {
          "db.operation": "search",
          "search.term": q,
          "db.table": "courses",
          "search.type": "text_search"
        }
      }, async (dbSpan) => {
        const searchResults = await db.select({...}).from(courses)
          .leftJoin(users, eq(courses.instructorId, users.id))
          .where(or(
            ilike(courses.title, `%${q}%`),
            ilike(courses.description, `%${q}%`)
          ))
          .orderBy(courses.rating)
          .limit(50);

        dbSpan.setAttributes({
          "db.results_count": searchResults.length,
          "search.db.matches_found": searchResults.length > 0,
          "search.db.query_successful": true
        });

        return searchResults;
      });

      serverSpan.setAttributes({
        "search.server.success": true,
        "search.server.results_count": results.length,
        "search.server.has_results": results.length > 0,
        "response.format": "structured"
      });

      res.json({
        results,
        total: results.length,
        query: q
      });

    } catch (error: any) {
      serverSpan.setAttributes({
        "search.server.success": false,
        "search.server.error": error.message,
        "search.server.error_type": error.constructor.name
      });
      serverSpan.recordException(error);
      throw error;
    }
  });
});
```

### Step 4: Analyze Trace Waterfalls and Error Correlation

**🎯 Key Learning: Using Trace Data to Identify Parameter Mismatches**

1. **Navigate to Sentry Performance:**
   - **Go to Performance** → **Traces**
   - **Filter by Operation**: `ui.search` or failed HTTP calls
   - **Sort by Duration**: Find slow or failed traces

2. **Examine Complete Error Flow:**
   ```
   📊 Trace: Course Search Flow (450ms, ERROR)
   ├── 🔍 ui.search - Course Search Flow
   │   ├── search.term: "javascript"
   │   ├── search.component: "CoursesPage"
   │   └── 🌐 http.client - Search Courses API Call (ERROR)
   │       ├── api.parameter_name: "q"  
   │       ├── http.url: "/search/courses?q=javascript"
   │       └── 🖥️ http.server - Handle Course Search Request (ERROR)
   │           ├── request.expected_param: "q"
   │           ├── validation.result: "passed"  ← Shows fix working
   │           └── 🗄️ db.query - Search Database for Courses
   │               ├── db.results_count: 3
   │               └── search.db.matches_found: true
   ```

3. **Stack Trace Analysis for Parameter Issues:**
   - **Error Location**: Parameter validation in search routes
   - **Call Stack**: HTTP request → route handler → parameter validation
   - **Variable State**: Check `q` parameter presence and type
   - **Context Data**: Review received vs expected parameters

### Step 5: Fix and Validate Using Error Monitoring

**🎯 Key Learning: Confirming Fixes Through Error Analysis**

1. **Test Fixed Implementation:**
   - Search for terms like "javascript", "monitoring"
   - Results should display properly

2. **Monitor Error Resolution:**
   - **Error Frequency** → Should drop to 0%
   - **Success Logs** → Look for "Course search request received" with valid parameters
   - **Span Attributes** → `validation.result: "passed"`, `search.server.success: true`
   - **Stack Traces** → No more parameter validation errors

3. **Performance Validation:**
   - **Response Time** → Faster search responses
   - **Success Rate** → 100% search success rate
   - **Error Rate** → Eliminated parameter validation errors

## Learning Outcomes: Sentry Error Analysis and Tracing Mastery

### **Sentry Error Analysis Skills**
- ✅ **Navigate Issues dashboard** for error identification and prioritization
- ✅ **Analyze stack traces** to pinpoint exact failure locations (JSON.parse errors)
- ✅ **Use error tags and extra data** for detailed context analysis
- ✅ **Correlate error patterns** across frontend and backend systems
- ✅ **Track error frequency and impact** for validation of fixes

### **Production-Ready Span Implementation**
- ✅ **Create authentication spans** with provider, user credentials, and signature status
- ✅ **Implement search spans** with query details and results count
- ✅ **Add comprehensive span attributes** for debugging context
- ✅ **Use structured logging** with Sentry logger integration  
- ✅ **Monitor span performance** in Sentry Performance dashboard

### **Custom Attribute Design Patterns**
- ✅ **Authentication attributes**: `auth.provider`, `auth.user.email`, `auth.login_signature.defined`
- ✅ **Search attributes**: `search.query`, `search.results_count`, `search.query_length`
- ✅ **Enrollment attributes**: `enrollment.course.title`, `enrollment.user_id_provided`, `enrollment.validation.result`
- ✅ **HTTP request attributes**: `http.method`, `http.url`, `http.route`
- ✅ **Database operation attributes**: `db.operation`, `db.results_count`
- ✅ **Business logic attributes**: Custom fields for debugging specific workflows

### **Sentry Logging and Context Enhancement**
- ✅ **Implement structured logging** with `logger.info()` and `logger.fmt` templates
- ✅ **Add debugging context** to error captures with tags and extra data
- ✅ **Use custom span attributes** for business logic tracking
- ✅ **Correlate logs with traces** for complete request visibility
- ✅ **Track key metrics** through span attributes (results count, query length)

### **Error-Driven Debugging Workflow**
1. **🔍 Error Discovery**: Use Issues dashboard to identify problems
2. **📊 Stack Trace Analysis**: Examine exact failure points and call chains
3. **🏷️ Context Review**: Analyze error tags, extra data, and attributes
4. **📈 Tracing Implementation**: Add spans to capture complete request flows
5. **🎯 Root Cause Analysis**: Use error context and span attributes together
6. **🔧 Targeted Fixes**: Implement changes based on error evidence
7. **✅ Validation**: Confirm fixes through error frequency monitoring

### **Production-Ready Debugging Skills**
- **API Contract Validation**: Using error analysis to identify parameter mismatches
- **Authentication Flow Debugging**: Stack trace analysis for JWT decoding failures
- **Performance Impact Assessment**: Using span timing with error correlation
- **Error Context Enhancement**: Rich logging for debugging complex issues
- **Fix Effectiveness Measurement**: Error rate monitoring for validation

### **Hands-On Implementation Summary**
Throughout this workshop, you implemented:

#### **Module 1: Authentication Spans**
- **Frontend span**: `sso.authentication` with provider, user credentials, and signature status
- **Backend span**: `sso.authentication.backend` with request analysis and signature decoding details
- **Custom attributes**: Authentication provider, user details, signature validation status
- **Enhanced error capture**: Contextual debugging information for JWT failures

#### **Module 2: Search Flow Spans**  
- **Frontend API span**: `search.courses` with query details and structured logging
- **Backend search span**: `search.courses.server` with database operations and results tracking
- **Query monitoring**: Search terms, query length, and parameter validation
- **Results tracking**: Course count found and search success metrics

#### **Module 3: Enrollment Flow Spans**
- **Frontend enrollment span**: `enrollment.create.frontend` with course and user tracking
- **Backend enrollment span**: `enrollment.create.server` with course validation and analytics
- **Course intelligence**: Track course title, category, level, and instructor details
- **User validation**: Monitor user ID presence and validation patterns
- **Business analytics**: Course enrollment trends and user behavior insights

#### **Key Implementation Patterns**
- **Span Naming**: Descriptive names like `sso.authentication`, `search.courses.server`, and `enrollment.create.frontend`
- **Operation Types**: `auth.sso`, `http.client`, `db.search`, `enrollment.process` for proper categorization
- **Rich Attributes**: Business-specific context for debugging complex workflows
- **Structured Logging**: `logger.info()` with `logger.fmt` for correlation with spans
- **Error Enhancement**: Exception capture with tags, extra data, and debugging context
- **Business Intelligence**: Course analytics and user behavior tracking through span attributes

## Module 3: Enrollment Flow Debugging with Business Intelligence

### The Enrollment Scenario

Your application handles course enrollments where users can enroll in various courses. The frontend team sends enrollment requests with course information, while the backend validates both course existence and user context. However, there's an inconsistency where the user ID is sometimes missing from requests, causing validation failures.

**The Problem:**
- Frontend sometimes doesn't include user ID in enrollment requests
- Backend requires both course ID and user ID for proper enrollment processing
- Missing user data causes enrollment validation to fail
- No visibility into which courses are being enrolled in most frequently

### Step 1: Add Frontend Enrollment Tracking

**🎯 Key Learning: User Action Monitoring with Business Context**

1. **Frontend Enrollment Spans** in `apps/frontend/src/services/api.ts`:

```typescript
import * as Sentry from '@sentry/react';

const { logger } = Sentry;

export const api = {
  // ... other methods
  enrollments: {
    create: (courseId: string, userId: string | undefined) => 
      Sentry.startSpan(
        {
          name: 'enrollment.create.frontend',
          op: 'http.client',
          attributes: {
            'enrollment.course_id': courseId,
            'enrollment.user_id': userId || 'undefined',
            'enrollment.user_id_provided': !!userId,
          },
        },
        () => {
          logger.info(logger.fmt`Creating enrollment for course: ${courseId}, user: ${userId || 'undefined'}`);
          return fetchApi<any>('/enrollments', {
            method: 'POST',
            body: JSON.stringify({ courseId, userId }),
          });
        }
      ),
  },
};
```

### Step 2: Add Backend Enrollment Processing with Course Analytics

**🎯 Key Learning: Business Logic Instrumentation with Rich Course Context**

2. **Backend Enrollment Processing Spans** in `apps/server/src/modules/enrollments/routes.ts`:

```typescript
import * as Sentry from '@sentry/node';

const { logger } = Sentry;

// TOFIX Module 3: Broken enrollments missing userId
enrollmentRoutes.post('/enrollments', async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    await Sentry.startSpan(
      {
        name: 'enrollment.create.server',
        op: 'enrollment.process',
        attributes: {
          'enrollment.course_id': courseId || 'undefined',
          'enrollment.user_id': userId || 'undefined',
          'enrollment.user_id_provided': !!userId,
        },
      },
      async (span) => {
        logger.info(logger.fmt`Processing enrollment request for course: ${courseId || 'undefined'}, user: ${userId || 'undefined'}`);

        // Add initial request validation attributes
        span.setAttributes({
          'enrollment.request.course_id_provided': !!courseId,
          'enrollment.request.user_id_provided': !!userId,
        });

        // Course validation with course details tracking
        if (!courseId) {
          span.setAttributes({
            'enrollment.validation.course_id': 'missing',
            'enrollment.validation.result': 'failed',
            'enrollment.error': 'course_id_required',
          });
          res.status(400).json({ error: 'Course ID is required.' });
          return;
        }

        logger.info(logger.fmt`Verifying course exists: ${courseId}`);

        const courseCheck = await db
          .select()
          .from(courses)
          .where(eq(courses.id, courseId))
          .limit(1);

        if (courseCheck.length === 0) {
          span.setAttributes({
            'enrollment.validation.course_exists': false,
            'enrollment.validation.result': 'failed',
            'enrollment.error': 'course_not_found',
          });
          res.status(404).json({ error: `Course with id ${courseId} not found` });
          return;
        }

        // Add comprehensive course details to span
        const course = courseCheck[0];
        span.setAttributes({
          'enrollment.validation.course_exists': true,
          'enrollment.course.title': course.title,
          'enrollment.course.category': course.category || 'unknown',
          'enrollment.course.level': course.level || 'unknown',
          'enrollment.course.instructor_id': course.instructorId || 'unknown',
        });

        logger.info(logger.fmt`Course found: "${course.title}" (${course.category})`);

        // User validation tracking
        if (!userId) {
          span.setAttributes({
            'enrollment.validation.user_id': 'missing',
            'enrollment.validation.result': 'failed',
            'enrollment.error': 'user_id_missing',
          });
          throw new Error('User ID is missing');
        }

        // Success tracking
        span.setAttributes({
          'enrollment.validation.user_id': 'provided',
          'enrollment.validation.result': 'passed',
          'enrollment.process.success': true,
        });

        logger.info(logger.fmt`Enrollment validation successful for user ${userId} in course "${course.title}"`);

        res.json({ 
          success: true, 
          message: 'Enrollment validation successful',
          courseId,
          userId 
        });
      }
    );

  } catch (error: any) {
    Sentry.captureException(error, {
      tags: {
        operation: 'enrollment.create.server',
        course_id: req.body.courseId || 'undefined',
        user_id: req.body.userId || 'undefined',
      },
      extra: {
        requestBody: req.body,
        courseId: req.body.courseId,
        userId: req.body.userId,
        hasUserId: !!req.body.userId,
        hasCourseId: !!req.body.courseId,
      },
    });

    logger.error(logger.fmt`Enrollment error for course ${req.body.courseId || 'undefined'}, user ${req.body.userId || 'undefined'}: ${error.message}`);
    throw new Error('Failed to enroll in course');
  }
});
```

### Step 3: Analyze Enrollment Flow and Business Intelligence

**🎯 Key Learning: Business Analytics Through Distributed Tracing**

1. **Navigate to Sentry Performance:**
   - **Filter by Operation**: `enrollment.process` for backend processing
   - **Filter by Operation**: `http.client` with enrollment spans
   - **Examine Enrollment Success/Failure Patterns**

2. **Successful Enrollment Trace Analysis:**
   ```
   ✅ Trace: Course Enrollment Success (200ms, OK)
   ├── 🎓 enrollment.create.frontend - User Enrollment Request
   │   ├── enrollment.course_id: "javascript-advanced"
   │   ├── enrollment.user_id: "user-123"
   │   ├── enrollment.user_id_provided: true
   │   └── 🖥️ enrollment.create.server - Server Processing
   │       ├── enrollment.course.title: "Advanced JavaScript Patterns"
   │       ├── enrollment.course.category: "programming"
   │       ├── enrollment.course.level: "advanced"
   │       ├── enrollment.validation.result: "passed"
   │       └── enrollment.process.success: true
   ```

3. **Failed Enrollment Pattern Recognition:**
   ```
   ❌ Trace: Enrollment Failure (150ms, ERROR)
   ├── 🎓 enrollment.create.frontend - User Enrollment Request
   │   ├── enrollment.course_id: "react-fundamentals"
   │   ├── enrollment.user_id: "undefined"
   │   ├── enrollment.user_id_provided: false  ← MISSING USER ID
   │   └── 🖥️ enrollment.create.server - Server Processing
   │       ├── enrollment.validation.user_id: "missing"
   │       ├── enrollment.validation.result: "failed"
   │       └── enrollment.error: "user_id_missing"
   ```

### Step 4: Business Intelligence and Course Analytics

**🎯 Key Learning: Extracting Business Insights from Span Data**

1. **Course Enrollment Analytics:**
   - **Popular Courses**: Filter by `enrollment.course.title` to see most enrolled courses
   - **Category Trends**: Group by `enrollment.course.category` for subject popularity
   - **Difficulty Preferences**: Analyze `enrollment.course.level` distribution
   - **Instructor Performance**: Track `enrollment.course.instructor_id` success rates

2. **User Behavior Patterns:**
   - **User ID Consistency**: Monitor `enrollment.user_id_provided` percentage
   - **Validation Success Rate**: Track `enrollment.validation.result` success vs failure
   - **Error Pattern Analysis**: Group by `enrollment.error` types

3. **Operational Monitoring:**
   - **Course Availability Issues**: Monitor `enrollment.validation.course_exists`
   - **Request Quality**: Track missing course ID vs missing user ID patterns
   - **Performance Metrics**: Enrollment processing time and success rates

### Step 5: Debug Missing User ID Issue

**🎯 Key Learning: Using Span Attributes for Root Cause Analysis**

1. **Identify the Pattern:**
   - **Filter traces** where `enrollment.user_id_provided: false`
   - **Examine request patterns** - which scenarios don't include user ID
   - **Correlate with frontend behavior** - identify triggering conditions

2. **Validate Fix Implementation:**
   - **Before Fix**: High percentage of `enrollment.user_id_provided: false`
   - **After Fix**: Near 100% `enrollment.user_id_provided: true`
   - **Error Reduction**: Decrease in `enrollment.error: "user_id_missing"`

3. **Performance and Business Impact:**
   - **Enrollment Success Rate**: Improved from partial to near 100%
   - **User Experience**: Elimination of enrollment validation failures
   - **Business Metrics**: Increased successful course enrollments

## Extended Practice Scenarios

1. **Complex Authentication Flows**
   - Multi-step OAuth with enhanced error context
   - Role-based authorization with detailed stack traces
   - Cross-service authentication with distributed tracing

2. **Advanced Search and API Debugging**
   - Complex query parameter validation with structured logging
   - Database performance optimization through span analysis
   - API versioning conflicts with error pattern analysis

3. **Performance and Error Correlation**
   - Database query optimization using span timing data
   - Memory leak detection through error frequency patterns
   - Rate limiting analysis with custom span attributes

4. **Error Aggregation and Monitoring**
   - Custom error grouping based on stack trace patterns
   - Performance regression detection through trace analysis
   - Automated alerting based on error frequency thresholds

This workshop provides comprehensive training in using Sentry's error monitoring, stack trace analysis, and distributed tracing for production-level debugging scenarios. 