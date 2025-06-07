# Sentry Academy Workshop Outline

## 🎯 **Workshop Overview**
**Goal**: Learn to debug realistic application issues using Sentry's error monitoring and distributed tracing capabilities across frontend and backend services.

**Key Learning Outcomes**:
- Experience real-world API integration failures 
- Use Sentry's automatic error capture without custom instrumentation
- Implement distributed tracing to debug complex request flows
- Fix authentication and search functionality issues

**Tech Stack**: React 19 + TypeScript frontend, Node.js + Express backend, PostgreSQL database

---

## 🚀 **Setup & Prerequisites**
- **Start Workshop**: `pnpm dev` (runs both frontend and backend)
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Sentry**: Pre-configured for both applications

---

## 📋 **Module 1: SSO Authentication Debugging** 
*Focus: API contract mismatches and automatic error capture*

### **Scenario**
- Frontend generates login signatures from SSO provider data
- Backend expects these signatures but crashes when they're undefined
- Results in unhandled authentication errors captured by Sentry

### **Workshop Flow**

#### **Step 1: Experience the Bug**
- Try SSO login (Google/GitHub buttons)
- Observe authentication failure in browser console
- Notice backend error: `"JWT token is required for SSO authentication"`

#### **Step 2: Debug with Direct API Testing**
- Test backend endpoints with/without login signatures using curl
- Understand API contract expectations
- Identify the signature decoding failure

#### **Step 3: Analyze Frontend Signature Generation**
- Examine browser console during SSO attempt
- See that frontend generates proper login signatures
- Understand how signatures are created from SSO provider data

#### **Step 4: Monitor in Sentry**
- View automatically captured authentication errors
- Examine error context and stack traces
- No custom instrumentation required

#### **Step 5: Fix the Issue**
- **Create Bug**: Comment out loginSignature parameter to simulate missing signature
- **Fix Bug**: Uncomment loginSignature parameter to send it properly
- **Alternative**: Update backend to validate signatures before decoding
- Verify the fix works

#### **Step 6: Explore Additional Errors**
- Test email/password login for property access errors
- See how inconsistent API responses cause frontend crashes

---

## 🔍 **Module 2: Search Functionality Debugging with Tracing**
*Focus: Distributed tracing implementation and API parameter debugging*

### **Scenario**
- Frontend sends search requests with `query` parameter
- Backend expects search requests with `q` parameter  
- Parameter mismatch causes search to always fail
- Tracing reveals the exact request/response flow

### **Workshop Flow**

#### **Step 1: Experience the Search Bug**
- Use search box to search for courses ("javascript", "monitoring", etc.)
- Observe search failures and "no courses found" messages
- Check browser console for API errors

#### **Step 2: Debug Backend API Directly**
- Test search endpoint with missing query: `GET /search/courses`
- Test search endpoint with correct parameter: `GET /search/courses?q=javascript`
- Understand the expected API contract

#### **Step 3: Analyze Frontend Implementation**
- Examine `CoursesPage.tsx` search logic
- Review `api.ts` search method
- Identify parameter name mismatch: `query` vs `q`

#### **Step 4: Understand the API Contract Mismatch**
- Frontend sends: `/search/courses?query=javascript`
- Backend expects: `/search/courses?q=javascript`
- Result processing also expects different data structure

#### **Step 5: Implement Distributed Tracing**

##### **Frontend Tracing**
- Add `Sentry.startSpan` to search API calls (`op: "http.client"`)
- Add `Sentry.startSpan` to search component actions (`op: "ui.search"`)
- Include attributes: `search.query`, `api.parameter_name`, `api.full_url`

##### **Backend Tracing**  
- Add `Sentry.startSpan` to route handlers (`op: "http.server"`)
- Add `Sentry.startSpan` to database queries (`op: "db.query"`)
- Include attributes: `request.parameters`, `request.expected_param`, `request.received_q`

##### **Trace Analysis**
- View waterfall traces in Sentry dashboard
- Compare frontend sent vs backend received parameters
- Identify root cause from trace attributes
- See nested spans for component → API → database flow

#### **Step 6: Fix Based on Trace Evidence**
- Change frontend parameter from `query` to `q`
- Verify fix with before/after trace comparison
- Observe successful search results and performance metrics

---

## 🎓 **Learning Outcomes Summary**

### **Module 1 Achievements**
- ✅ Experience realistic authentication failures
- ✅ Use Sentry's automatic error capture (no custom code)
- ✅ Debug API contract mismatches with direct testing
- ✅ Fix login signature integration issues

### **Module 2 Achievements**  
- ✅ Implement custom distributed tracing with Sentry
- ✅ Debug API parameter mismatches using trace waterfall
- ✅ Use span attributes to identify root causes
- ✅ Verify fixes with performance monitoring

### **Real-World Skills Gained**
- API debugging strategies using monitoring tools
- Frontend/backend integration troubleshooting
- Distributed tracing implementation best practices
- Error monitoring configuration and analysis
- Performance monitoring and optimization insights

---

## 🔧 **Technical Implementation Notes**

### **File Locations for Bug Fixes**
- **Module 1**: `apps/frontend/src/components/auth/LoginForm.tsx` (line ~58)
- **Module 2**: `apps/frontend/src/services/api.ts` (line ~98)

### **Error Scenarios**
- **Authentication**: Missing login signature causes backend decoding failure (`JSON.parse(atob(undefined))`)
- **Search**: API parameter name mismatch (`query` vs `q`) causes 400 errors
- **Both captured automatically** by Sentry without custom instrumentation

### **Tracing Patterns Demonstrated**
- **UI Actions**: `op: "ui.search"` for user interactions
- **HTTP Requests**: `op: "http.client"` for frontend API calls  
- **Server Handlers**: `op: "http.server"` for backend route processing
- **Database Operations**: `op: "db.query"` for search queries
- **Nested Spans**: Component → API → Backend → Database hierarchy

---

## 🎯 **Workshop Success Criteria**
1. **Both error scenarios** visible in Sentry dashboard
2. **Authentication working** after Module 1 fix
3. **Search functioning** after Module 2 fix
4. **Tracing implemented** with meaningful spans and attributes
5. **Root causes identified** through trace analysis rather than guesswork

**Duration**: ~90 minutes (45 min per module)
**Difficulty**: Intermediate (requires basic React/Node.js knowledge)
**Focus**: Real-world debugging with monitoring tools 