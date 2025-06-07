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
  dsn: import.meta.env.VITE_SENTRY_DSN || 'https://3a9b93c0dffb8559153ce45a04fcbc50@o4508130833793024.ingest.us.sentry.io/4509441326120960',

  _experiments: {
    enableLogs: true,
  },

  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration(),
  ],

  debug: true,

  tracesSampleRate: 1.0,
  tracePropagationTargets: ['localhost:3001'],

	replaysSessionSampleRate: 1.0,
	replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById('root')!).render(
    <App />
);
