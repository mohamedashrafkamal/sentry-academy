# Sentry Academy Workshop Outline

## 🎯 **Workshop Overview**
**What we're building**: You'll learn to debug real-world app issues using Sentry's tooling - error monitoring, distributed tracing, and logs. Think of it as becoming a debugging detective! 🕵️‍♂️

**What you'll walk away with**:
- Actually knowing how to use Sentry's Issues dashboard (not just staring at it confused)
- Building distributed tracing that actually helps you debug stuff
- Reading trace waterfalls like a pro to spot API contract fails
- Validating that your fixes actually work (shocking concept, right?)
- A solid debugging workflow that doesn't involve `console.log` everywhere

**Tech Stack**: React 19 + TypeScript frontend, Node.js + Express backend, PostgreSQL database (the usual suspects)

---

## 🚀 **Setup & Prerequisites**
- **Sentry Configuration**: Pre-configured for both applications (check DSN settings)
- **Start Workshop**: `pnpm dev` (runs both frontend and backend)
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Sentry Dashboard**: Access your project dashboard - you'll use it throughout

---

## 📋 **Module 1: SSO Authentication Debugging** 
*AKA: "Why is my login broken and how do I fix it without crying?"*

### **The Situation**
You know the drill - frontend team thinks they're sending everything the backend needs, backend team thinks frontend is sending garbage. In this case:
- Frontend generates fancy JWT login signatures from SSO provider data
- Backend expects these signatures but faceplants when they're `undefined`
- Users can't log in, and you get the classic `"undefined" is not valid JSON` error

### **How We'll Debug This**

#### **Step 1: Break Things First**
- Click those shiny SSO login buttons (Google/GitHub)
- Watch it explode in the browser console 💥
- See that beautiful error: `SyntaxError: Unexpected token 'u', "undefined" is not valid JSON`

#### **Step 2: Detective Work in Sentry** 
*Time to be Sherlock Holmes with the Issues dashboard*

1. **Find the Chaos:**
   - Jump into **Issues** → **All Unresolved**  
   - Search for "JSON" or "atob" (your new best friends)
   - See how often this is breaking and ruining people's day

2. **Dig Into the Mess:**
   - **Stack Trace Detective Work**: Find that `JSON.parse(atob(undefined))` call
   - **Follow the Breadcrumbs**: See the call chain that led to disaster
   - **Check the Request**: What HTTP stuff was sent (or not sent)
   - **Environment Context**: Is this just dev or are we breaking prod too?

3. **Damage Assessment:**
   - **Who's Affected**: Count the victims
   - **How Often**: Is this happening every time or just sometimes?
   - **When Did It Start**: Was this always broken or did someone push bad code?

#### **Step 3: Poke It With a Stick (Test the API)**
*Let's make some controlled chaos to understand what's happening*

1. **Break It On Purpose:**
   ```bash
   # This will make Sentry very unhappy (which is what we want)
   curl -X POST http://localhost:3001/api/auth/sso/google \
     -H "Content-Type: application/json" \
     -d '{"userData": {"email": "test@example.com", "name": "Test User", "provider": "google"}}'
   ```

2. **Watch Sentry Complain:**
   - **Find your new error** in the Issues dashboard (it'll be there in seconds)
   - **Compare with the browser errors** - yep, same garbage fire
   - **Notice what's missing** - that `loginSignature` field we forgot to send

3. **Make It Work (For Science):**
   ```bash
   # This should make everyone happy
   curl -X POST http://localhost:3001/api/auth/sso/google \
     -H "Content-Type: application/json" \
     -d '{"userData": {...}, "loginSignature": "valid_jwt_token"}'
   ```

#### **Step 4: Read the Tea Leaves (Stack Trace Analysis)**
*Time to channel your inner code archaeologist*

1. **Follow the Crash:**
   - **Ground Zero**: `JSON.parse(atob(loginSignature))` in the auth routes
   - **The Journey**: HTTP request → route handler → JWT decoding → BOOM 💥
   - **The Culprit**: `loginSignature` is `undefined` (surprise!)
   - **Where to Find It**: `apps/server/src/modules/auth/routes.ts:66`

2. **Use Sentry's Context Clues:**
   - **Filter by Tags**: Look for `feature:authentication`, `provider:google`, `step:signature_decode`
   - **Check the Extra Data**: `hasLoginSignature: false`, `signatureType: "undefined"`
   - **Request Analysis**: Compare what was sent vs what we expected (spoiler: they don't match)

#### **Step 5: Add Some Smart Logging (Custom Spans)**
*Let's make Sentry actually useful for debugging this mess*

1. **Frontend Spans That Don't Suck** (in `LoginForm.tsx`):
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

           // Enhanced error capture with debugging context
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

   2. **Backend Spans That Actually Help** (in `auth/routes.ts`):
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

   3. **Check Your Work:**
   - **Performance Dashboard** → Your new spans should show up with all the juicy details
   - **Span Attributes** → Provider, user creds, signature status - all there
   - **Error Context** → Way better debugging info than before
   - **Trace Waterfall** → You can now see the whole auth flow like a timeline

#### **Step 6: Victory Lap (Making Sure You Actually Fixed It)**
- ✅ **No more angry error alerts** - Sentry should be quiet now
- ✅ **Success rate goes up** - users can actually log in again
- ✅ **Users stop complaining** - always a good sign
- ✅ **Release tracking** shows your fix worked (pat yourself on the back)

---

## 🔍 **Module 2: Search API Debugging**
*AKA: "Why is search broken and why do frontend/backend teams never talk to each other?"*

### **The Situation**
Classic frontend vs backend communication failure:
- Frontend sends search with `query` parameter (makes sense, right?)
- Backend expects `q` parameter (because why be consistent?)
- 100% search failure rate (chef's kiss 👌)
- Users search for stuff, get nothing, probably switch to your competitor
- Distributed tracing will save the day by showing exactly where things go wrong

### **How We'll Debug This**

#### **Step 1: Break Search (Again)**

1. **Make Search Cry:**
   - Try searching for "javascript", "monitoring", whatever
   - Watch it return absolutely nothing (beautiful!)

2. **Find the Carnage in Sentry:**
   - **Check Issues** → Hunt for search-related disasters
   - **What You'll See**: `INVALID_SEARCH_PARAMETER` validation failures everywhere  
   - **How Often**: Every. Single. Search. Attempt. 💀

#### **Step 2: Add Some Actual Useful Logging**
*Time to figure out what the hell is actually happening*

##### **Frontend: Log What We're Actually Sending**

1. **Add Search Logging** (`apps/frontend/src/pages/CoursesPage.tsx`):
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
           searchType: 'course_search'
         }
       });
       return api.search.courses(searchQuery);
     }
   }, [searchQuery]);
   ```

2. **Add API Error Context** (`apps/frontend/src/services/api.ts`):
   ```typescript
   search: {
     courses: (query: string) => {
       Sentry.captureMessage(`Making search API call`, {
         level: 'info',
         tags: { feature: 'search', api: 'courses' },
         extra: {
           searchQuery: query,
           apiEndpoint: '/search/courses',
           parameterUsed: 'q',
           fullUrl: `/search/courses?q=${encodeURIComponent(query)}`
         }
       });
       return fetchApi(`/search/courses?q=${encodeURIComponent(query)}`);
     }
   }
   ```

##### **Backend: Log What We're Actually Getting**

3. **Add Backend Search Error Logging** (`apps/server/src/modules/search/routes.ts`):
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
           qParamType: typeof q
         }
       });
   
       if (!q || typeof q !== 'string') {
         const error = new Error(`Missing required parameter 'q'. Received: ${Object.keys(req.query).join(', ')}`);
         
         Sentry.captureException(error, {
           tags: { feature: 'search', error_type: 'validation_error' },
           extra: {
             expectedParam: 'q',
             receivedParams: Object.keys(req.query),
             allQueryParams: req.query
           }
         });
         throw error;
       }
     } catch (error: any) {
       // Enhanced error capture
       throw error;
     }
   });
   ```

#### **Step 3: Add Distributed Tracing (The Good Stuff)**
*Now we can see the whole request journey from search box to database*

##### **Frontend: Track Search Requests**

1. **Add Search API Spans** (`apps/frontend/src/services/api.ts`):
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

##### **Backend: Track What Happens to Search Requests**

2. **Instrument Search Route Handler** (`apps/server/src/modules/search/routes.ts`):
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

#### **Step 3: Analyze Traces in Sentry Performance Dashboard**
**🎯 Key Learning: Reading Trace Waterfalls for Root Cause Analysis**

1. **Navigate to Sentry Performance:**
   - **Go to Performance** → **Traces**
   - **Filter by Operation**: `ui.search` or `http.client`
   - **Sort by Duration**: Find slow/failing traces

2. **Examine Trace Waterfall Structure:**
   ```
   📊 Trace: User Course Search (450ms, ERROR)
   ├── 🖱️  ui.search - User Course Search (450ms)
   │   ├── search.term: "javascript"
   │   ├── search.component: "CoursesPage"
   │   └── 🌐 http.client - Search Courses API Call (420ms, ERROR)
   │       ├── api.parameter_name: "query" ← BUG REVEALED!
   │       ├── request.url: "/search/courses?query=javascript"
   │       └── 🚫 ERROR: 400 Bad Request
   │           └── 🖥️  http.server - Handle Course Search Request (380ms, ERROR)
   │               ├── backend.expected_param: "q"
   │               ├── backend.received_q: "undefined" ← PROBLEM!
   │               ├── backend.received_query: "javascript" ← ACTUAL VALUE!
   │               ├── validation.result: "failed"
   │               └── 🚫 ERROR: Missing 'q' parameter
   ```

3. **Key Insights from Trace Analysis:**
   - **Parameter Mismatch Clearly Visible**: `query` vs `q`
   - **Impact Assessment**: 100% failure rate, 450ms wasted time
   - **Exact Failure Point**: Backend parameter validation
   - **Root Cause**: Frontend/backend API contract mismatch

#### **Step 4: Implement Trace-Guided Fix**
**🎯 Key Learning: Using Trace Evidence for Targeted Fixes**

1. **Fix Parameter Name** (`apps/frontend/src/services/api.ts`):
   ```typescript
   // BEFORE (revealed by trace attributes):
   "api.parameter_name": "query",
   return fetchApi(`/search/courses?query=${query}`);
   
   // AFTER (fix based on trace evidence):
   "api.parameter_name": "q", 
   return fetchApi(`/search/courses?q=${query}`);
   ```

2. **Fix Response Processing** (`apps/frontend/src/pages/CoursesPage.tsx`):
   ```typescript
   // BEFORE: Expects array directly
   courses = Array.isArray(searchResults) ? searchResults : [];
   
   // AFTER: Handle structured response
   courses = searchResults?.results || [];
   ```

#### **Step 5: Validate Fix with Performance Monitoring**
**🎯 Key Learning: Using Sentry Metrics to Confirm Fix Success**

1. **Test Fixed Implementation:**
   - Search for terms like "javascript", "monitoring"
   - Results should display properly

2. **Compare Before/After Traces:**

   **BEFORE (Failed Trace):**
   ```
   ❌ Trace: Search Failed (450ms, ERROR)
   ├── api.parameter_name: "query"
   ├── backend.received_q: "undefined"
   ├── validation.result: "failed"
   └── ERROR: Missing 'q' parameter
   ```

   **AFTER (Successful Trace):**
   ```
   ✅ Trace: Search Success (85ms, OK)
   ├── api.parameter_name: "q"
   ├── backend.received_q: "javascript"
   ├── validation.result: "passed"
   ├── db.results_count: 3
   └── response.success: true
   ```

3. **Performance Improvements Verified:**
   - ✅ **Error Rate**: 0% (down from 100%)
   - ✅ **Response Time**: 85ms (down from 450ms)
   - ✅ **Success Rate**: 100% (up from 0%)
   - ✅ **User Experience**: Results display correctly

#### **Step 6: Advanced Trace Analysis Techniques**

1. **Span Correlation Patterns:**
   - **Parent-Child Relationships**: UI → API → Server → Database
   - **Timing Analysis**: Where is time being spent?
   - **Error Propagation**: How errors flow through the system

2. **Attribute-Based Debugging:**
   - **Custom Attributes**: Add business-specific context
   - **Error Context**: Include debugging information
   - **Performance Markers**: Track critical performance metrics

---

## 📚 **Module 3: Enrollment Flow Debugging with Comprehensive Tracing**
*Focus: User action tracking and business logic instrumentation*

### **Scenario**
- Frontend sends enrollment requests but inconsistently includes user ID
- Backend expects both course ID and user ID for enrollment validation
- Missing user ID causes enrollment validation failures
- Comprehensive tracing reveals missing data patterns and course enrollment analytics

### **Sentry Enrollment Tracing Implementation**

#### **Step 1: Add Frontend Enrollment Spans**
**🎯 Key Learning: User Action Tracking with Business Context**

1. **Frontend Enrollment Instrumentation** (`apps/frontend/src/services/api.ts`):
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

#### **Step 2: Add Backend Enrollment Spans with Course Analytics**
**🎯 Key Learning: Business Logic Instrumentation with Rich Course Context**

2. **Backend Enrollment Processing** (`apps/server/src/modules/enrollments/routes.ts`):
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

#### **Step 3: Analyze Enrollment Flow Traces**
**🎯 Key Learning: Business Logic Debugging with Trace Analysis**

1. **Navigate to Sentry Performance:**
   - **Filter by Operation**: `enrollment.process` or `http.client`
   - **Examine Enrollment Patterns**: User ID presence/absence patterns
   - **Course Analytics**: Most enrolled courses, categories, levels

2. **Trace Waterfall Analysis:**
   ```
   📊 Trace: Course Enrollment Flow (200ms, SUCCESS)
   ├── 🎓 enrollment.create.frontend - User Enrollment Request
   │   ├── enrollment.course_id: "course-123"
   │   ├── enrollment.user_id: "user-456"
   │   ├── enrollment.user_id_provided: true
   │   └── 🖥️ enrollment.create.server - Server Enrollment Processing
   │       ├── enrollment.course.title: "Advanced JavaScript"
   │       ├── enrollment.course.category: "programming"
   │       ├── enrollment.course.level: "advanced"
   │       ├── enrollment.validation.result: "passed"
   │       └── enrollment.process.success: true
   ```

3. **Error Pattern Analysis:**
   ```
   ❌ Trace: Failed Enrollment (150ms, ERROR)
   ├── 🎓 enrollment.create.frontend - User Enrollment Request
   │   ├── enrollment.course_id: "course-789"
   │   ├── enrollment.user_id: "undefined"
   │   ├── enrollment.user_id_provided: false  ← ISSUE IDENTIFIED
   │   └── 🖥️ enrollment.create.server - Server Enrollment Processing
   │       ├── enrollment.validation.user_id: "missing"
   │       ├── enrollment.validation.result: "failed"
   │       └── enrollment.error: "user_id_missing"
   ```

#### **Step 4: Enrollment Analytics and Monitoring**
**🎯 Key Learning: Business Intelligence Through Span Attributes**

1. **Course Enrollment Analytics:**
   - **Popular Courses**: Track `enrollment.course.title` frequency
   - **Category Trends**: Monitor `enrollment.course.category` patterns
   - **Level Distribution**: Analyze `enrollment.course.level` preferences
   - **Instructor Performance**: Track `enrollment.course.instructor_id` success rates

2. **User Behavior Analysis:**
   - **User ID Patterns**: Monitor `enrollment.user_id_provided` trends
   - **Validation Failures**: Track `enrollment.validation.result` failures
   - **Success Rates**: Analyze `enrollment.process.success` metrics

3. **Error Pattern Recognition:**
   - **Missing Data Issues**: Identify `enrollment.error` types
   - **Course Availability**: Monitor `enrollment.validation.course_exists`
   - **User Context Problems**: Track user ID provision patterns

---

## 🎓 **Learning Outcomes Summary**

### **Module 1: Sentry Error Analysis Mastery**
- ✅ **Navigate Issues dashboard** for error identification and prioritization
- ✅ **Analyze stack traces** to pinpoint exact failure locations and call chains
- ✅ **Use error tags and extra data** for detailed context analysis
- ✅ **Implement structured logging** with meaningful tags and context
- ✅ **Correlate error patterns** across frontend and backend systems

### **Module 2: Distributed Tracing with Rich Context**  
- ✅ **Design comprehensive span hierarchies** with meaningful operations
- ✅ **Add detailed debugging attributes** for business logic tracking
- ✅ **Implement nested spans** for complex request flows
- ✅ **Use span error tracking** to correlate with error monitoring
- ✅ **Create performance baselines** for optimization measurement

### **Sentry-Guided Debugging Workflow Mastered**
1. **🔍 Error Discovery**: Use Issues dashboard to identify and prioritize problems
2. **📊 Context Analysis**: Examine stack traces, error tags, and patterns
3. **🧪 Controlled Reproduction**: Create test scenarios to understand issues
4. **📈 Tracing Implementation**: Add comprehensive instrumentation for visibility
5. **🎯 Root Cause Analysis**: Use trace attributes to pinpoint exact problems
6. **🔧 Targeted Fixes**: Implement changes based on trace evidence
7. **✅ Fix Validation**: Confirm success with improved Sentry metrics

### **Production-Ready Skills Gained**
- **API Contract Debugging**: Using traces to identify parameter mismatches
- **Authentication Flow Analysis**: Debugging missing JWT signatures with stack traces
- **Performance Optimization**: Using trace timing data to improve response times
- **Error Impact Assessment**: Understanding user impact through Sentry metrics
- **Release Health Monitoring**: Tracking fix effectiveness across deployments

### **Hands-On Implementation Completed**
- **✅ Authentication Spans**: Frontend and backend spans with user credentials, provider details, and signature validation
- **✅ Search API Spans**: Frontend API spans with query details and structured logging
- **✅ Backend Search Spans**: Server-side spans with database operation tracking and results count
- **✅ Enrollment Flow Spans**: Frontend and backend enrollment tracking with course analytics and user validation
- **✅ Rich Attribute Design**: Custom attributes for debugging authentication, search, and enrollment workflows
- **✅ Structured Logging**: Sentry logger integration with formatted messages and context
- **✅ Error Enhancement**: Exception capture with contextual tags and debugging information
- **✅ Business Intelligence**: Course enrollment analytics and user behavior tracking through span attributes

---

## 🔧 **Technical Implementation Guide**

### **Key Files and Bug Locations**
- **Module 1 Bug**: `apps/frontend/src/components/auth/LoginForm.tsx` (line ~58)
  - **Issue**: Missing `loginSignature` parameter in SSO login call
  - **Fix**: Add `loginSignature` parameter back to function call

- **Module 2 Bug**: `apps/frontend/src/services/api.ts` (line ~98)
  - **Issue**: API calls use `query` parameter, backend expects `q`
  - **Fix**: Change `query` to `q` in search endpoint URL

### **Sentry Configuration Requirements**
- **Frontend**: `@sentry/react` with React integration
- **Backend**: `@sentry/node` with Express integration
- **Tracing**: Performance monitoring enabled
- **Error Capture**: Automatic error boundary and exception handling

### **Tracing Implementation Patterns**
```typescript
// UI Operations
op: "ui.search" | "ui.navigation" | "ui.interaction"

// HTTP Client Calls  
op: "http.client"
attributes: { "http.method", "http.url", "api.endpoint" }

// Server Request Handling
op: "http.server" 
attributes: { "http.route", "request.method", "response.status" }

// Database Operations
op: "db.query"
attributes: { "db.operation", "db.table", "db.results_count" }
```

### **Critical Debugging Attributes**
- **Request Context**: `http.method`, `http.url`, `request.parameters`
- **Business Logic**: `search.query`, `auth.provider`, `user.action`
- **Error Context**: `validation.result`, `error.type`, `debug.received_params`
- **Performance**: `db.results_count`, `response.time`, `operation.success`

### **Recommended Sentry Logging Patterns**
```typescript
// Error Context Enhancement
Sentry.captureException(error, {
  tags: { feature: 'authentication', step: 'jwt_decode' },
  extra: {
    hasRequiredData: !!requiredField,
    dataType: typeof requiredField,
    requestContext: Object.keys(requestData)
  }
});

// Structured Information Logging
Sentry.captureMessage('Operation completed', {
  level: 'info',
  tags: { feature: 'search', component: 'api' },
  extra: {
    operationDuration: performance.now() - startTime,
    resultCount: results.length,
    cacheHit: wasCacheUsed
  }
});

// Custom Span Attributes
span.setAttributes({
  "business.operation": "user_search",
  "validation.passed": true,
  "data.source": "database",
  "performance.cached": false
});
```

---

## 🎯 **Workshop Success Criteria**

### **Completion Checkpoints**
1. **✅ Sentry Dashboard Navigation** - Find and analyze authentication errors
2. **✅ Error Context Analysis** - Use stack traces to understand call flow
3. **✅ Controlled Error Generation** - Create errors via API testing
4. **✅ Tracing Implementation** - Add meaningful spans with rich attributes
5. **✅ Trace Waterfall Analysis** - Identify root cause from trace data
6. **✅ Evidence-Based Fixes** - Implement solutions based on trace evidence
7. **✅ Fix Validation** - Confirm success with improved Sentry metrics

### **Technical Outcomes**
- **Authentication working** after Module 1 fix (0% error rate)
- **Search functioning** after Module 2 fix (100% success rate)
- **Comprehensive tracing** implemented across all request paths
- **Performance improved** with faster response times
- **Error monitoring** providing actionable insights

### **Troubleshooting Skills Developed**
- **Systematic debugging approach** using Sentry's full feature set
- **API contract validation** through distributed tracing
- **Performance bottleneck identification** via trace analysis
- **Error impact assessment** using frequency and user metrics
- **Fix effectiveness validation** through monitoring data

---

**Duration**: ~90 minutes (45 min per module)  
**Difficulty**: Intermediate (requires basic React/Node.js and Sentry knowledge)  
**Focus**: Production-ready debugging with comprehensive observability tools 