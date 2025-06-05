import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,

  _experiments: {
    enableLogs: true,
  },

  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration(),
  ],

  debug: false,

  tracesSampleRate: 0.9,
  tracePropagationTargets: ['localhost:3001'],

	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
