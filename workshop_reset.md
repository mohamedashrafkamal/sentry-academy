# Workshop Reset - Sentry Instrumentation Guide

This document serves as a complete reference for LLMs to understand how to add Sentry instrumentation to the Sentry Academy Workshop codebase. All the content listed below was removed during the workshop reset and can be re-added when needed.

## Overview

The Sentry Academy Workshop is a pnpm monorepo with frontend (React + Vite) and backend (Node.js + Express) applications. Both applications were fully instrumented with Sentry for error monitoring, performance tracking, and distributed tracing.

## Dependencies to Install

### Frontend Dependencies (`apps/frontend/package.json`)
```json
{
  "dependencies": {
    "@sentry/react": "^9.27.0"
  }
}
```

### Backend Dependencies (`apps/server/package.json`)
```json
{
  "dependencies": {
    "@sentry/node": "^9.27.0"
  }
}
```

### Build Dependencies (for server builds)
```json
{
  "devDependencies": {
    "@sentry/esbuild-plugin": "^2.x.x"
  }
}
```

## Frontend Sentry Configuration

### 1. Create `apps/frontend/src/instrument.js`
```javascript
import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from "react-router-dom";

Sentry.init({
  dsn: "https://2cb8a9a7351068cebf07a5257ccca923@o4508130833793024.ingest.us.sentry.io/4509452972130304",

  
  sendDefaultPii: true,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
  ],

  _experiments: {
    enableLogs: true,
  },

  tracesSampleRate: 1.0,

  tracePropagationTargets: ["localhost:3001"],

  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
});
```

### 2. Update `apps/frontend/src/main.tsx`
```javascript
import './instrument.js';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!, {
  // Callback called when an error is thrown and not caught by an ErrorBoundary.
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn('Uncaught error', error, errorInfo.componentStack);
  }),
  // Callback called when React catches an error in an ErrorBoundary.
  onCaughtError: Sentry.reactErrorHandler(),
  // Callback called when React automatically recovers from errors.
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
    <App />
);
```

### 3. Update `apps/frontend/src/App.tsx`
Add Sentry routing integration:
```javascript
import * as Sentry from '@sentry/react';

const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

// Replace <Routes> with <SentryRoutes> in the JSX
```

### 4. Update `apps/frontend/src/components/ErrorBoundary.tsx`
```javascript
import * as Sentry from '@sentry/react';

// In useEffect:
React.useEffect(() => {
  // Send route errors to Sentry
  if (error) {
    Sentry.captureException(error);
  }
}, [error]);
```

### 5. Frontend API Service Instrumentation (`apps/frontend/src/services/api.ts`)
```javascript
import * as Sentry from '@sentry/react';

const { logger } = Sentry;

// In enrollments.create:
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
}

// In search.courses:
search: {
  courses: (query: string) => 
    Sentry.startSpan(
      {
        name: 'search.courses.frontend',
        op: 'http.client',
        attributes: {
          'search.query': query,
          'http.url': `/search/courses?q=${encodeURIComponent(query)}`,
        },
      },
      () => {
        logger.info(logger.fmt`Searching courses with query: ${query}`);
        return fetchApi<any[]>(`/search/courses?q=${encodeURIComponent(query)}`);
      }
    ),
}
```

### 6. Frontend Login Form Instrumentation (`apps/frontend/src/components/auth/LoginForm.tsx`)
```javascript
import * as Sentry from '@sentry/react';

const { logger } = Sentry;

// In handleSSO function:
const handleSSO = async (provider: string) => {
  try {
    await Sentry.startSpan(
      {
        name: 'sso.authentication.frontend',
        op: 'auth.sso',
        attributes: {
          'auth.provider': provider,
        },
      },
      async (span) => {
        const userCredentials = fetchSSOUserCredentials(provider);

        logger.info(logger.fmt`Logging user ${userCredentials.email} in using ${provider}`);

        span.setAttributes({
          'auth.user.id': userCredentials.id,
          'auth.user.email': userCredentials.email,
          'auth.user.name': userCredentials.name,
          'auth.user.avatar': userCredentials.avatar,
        });

        const loginSignature = createAuthenticationToken(userCredentials, provider);

        span.setAttributes({
          'auth.login_signature.defined': loginSignature !== undefined && loginSignature !== null,
        });

        await ssoLogin(provider, loginSignature);
      }
    );
  } catch (err: any) {
    logger.error(logger.fmt`Failed to login with ${provider} - issue with loginSignature`);
    // Handle error...
  }
};
```

## Backend Sentry Configuration

### 1. Create `apps/server/instrument.ts`
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://3a9b93c0dffb8559153ce45a04fcbc50@o4508130833793024.ingest.us.sentry.io/4509441326120960',

  _experiments: {
    enableLogs: true,
  },

  debug: true,

  tracesSampleRate: 1.0,
});
```

### 2. Update `apps/server/index.ts`
```typescript
import './instrument';
import * as Sentry from '@sentry/node';

// Before error handling middleware:
Sentry.setupExpressErrorHandler(app);
```

### 3. Update `apps/server/build.js`
```javascript
import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';

// In esbuild.build plugins:
plugins: [
  sentryEsbuildPlugin({
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    sourcemaps: {
      filesToDeleteAfterUpload: ['**/*.js.map'],
    },
  }),
],
```

### 4. Enrollment Routes Instrumentation (`apps/server/src/modules/enrollments/routes.ts`)
```typescript
import * as Sentry from '@sentry/node';

const { logger } = Sentry;

// In POST /enrollments route:
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

        // Add validation and business logic with span attributes...
        
        span.setAttributes({
          'enrollment.validation.result': 'passed',
          'enrollment.process.success': true,
        });
      }
    );
  } catch (error: any) {
    Sentry.captureException(error, {
      tags: {
        operation: 'enrollment.create.backend',
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
  }
});
```

### 5. Search Routes Instrumentation (`apps/server/src/modules/search/routes.ts`)
```typescript
import * as Sentry from '@sentry/node';

const { logger } = Sentry;

// In GET /search/courses route:
searchRoutes.get('/search/courses', async (req, res) => {
  try {
    await Sentry.startSpan(
      {
        name: 'search.courses.server',
        op: 'db.query',
        attributes: {
          'search.query': q || 'undefined',
          'search.type': 'courses',
        },
      },
      async (span) => {
        logger.info(logger.fmt`Course search request for: "${q || 'undefined'}"`);
        
        // Add search logic with span attributes...
        
        span.setAttributes({
          'search.results.count': results.length,
          'search.success': true,
        });
      }
    );
  } catch (error: any) {
    Sentry.captureException(error, {
      tags: {
        operation: 'search.courses.backend',
        query: q || 'undefined',
      },
      extra: {
        query: q,
        queryParams: req.query,
      },
    });
  }
});
```

### 6. Auth Routes Instrumentation (`apps/server/src/modules/auth/routes.ts`)
```typescript
import * as Sentry from '@sentry/node';

const { logger } = Sentry;

// In POST /sso route:
authRoutes.post('/sso', async (req, res) => {
  try {
    await Sentry.startSpan(
      {
        name: 'auth.sso.server',
        op: 'auth.verify',
        attributes: {
          'auth.provider': provider,
        },
      },
      async (span) => {
        logger.info(logger.fmt`SSO authentication request for provider: ${provider}`);
        
        // Add authentication logic with span attributes...
        
        span.setAttributes({
          'auth.user.id': user.id,
          'auth.success': true,
        });
      }
    );
  } catch (error: any) {
    Sentry.captureException(error, {
      tags: {
        operation: 'auth.sso.backend',
        provider: provider || 'undefined',
      },
      extra: {
        provider,
        requestBody: req.body,
      },
    });
  }
});
```

## Comment Patterns for Business Logic

### Frontend Comments
```javascript
// TOFIX Module 2: Frontend sends 'query' parameter but backend API expects 'q'
// Backend documented API: GET /search/courses?q=searchTerm
// Frontend mistakenly sends: GET /search/courses?query=searchTerm
// Fix: Change 'query' to 'q' to match backend API contract

// TOFIX Module 3: Broken enrollments missing userId

// Let API parameter errors bubble up to Sentry while still handling in state

// Re-throw to let the error bubble up for Sentry to catch

// Do cleanup but re-throw to keep error unhandled for Sentry
```

### Backend Comments
```typescript
// TOFIX Module 1: SSO Login with missing login signature

// TOFIX Module 3: Broken enrollments missing userId
```

## Sentry Configuration Environment Variables

Create `.env.sentry-build-plugin` for build configuration:
```
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=your_org_here
SENTRY_PROJECT=your_project_here
```

## Integration Patterns

1. **Error Handling**: Use `Sentry.captureException()` with contextual tags and extra data
2. **Performance Monitoring**: Use `Sentry.startSpan()` for tracking operations
3. **Structured Logging**: Use `Sentry.logger` with formatted messages
4. **React Integration**: Use `Sentry.reactErrorHandler()` for React error boundaries
5. **Express Integration**: Use `Sentry.setupExpressErrorHandler()` for Express error handling
6. **Router Integration**: Use `Sentry.withSentryReactRouterV7Routing()` for React Router

## Key Features Implemented

1. **Frontend**: React 19 + Vite with browser tracing, replay, and React Router integration
2. **Backend**: Node.js + Express with performance monitoring and profiling
3. **Distributed Tracing**: Cross-service span propagation between frontend and backend
4. **Error Boundaries**: React error boundary with Sentry integration
5. **Structured Logging**: Consistent logging patterns with context
6. **Build Integration**: Source map upload via esbuild plugin

## Workshop Learning Modules

The instrumentation supports these learning modules:

1. **Module 1**: SSO Authentication debugging with missing login signatures
2. **Module 2**: API contract mismatches (query parameter naming)
3. **Module 3**: Missing required parameters in enrollment flows

Each module includes specific Sentry spans, error capture, and contextual attributes designed to help students learn debugging workflows. 