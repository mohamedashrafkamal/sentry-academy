import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";

Sentry.init({
  dsn: "https://eac28863b89c7f53518532cd7e36613f@o4509480252735488.ingest.us.sentry.io/4509480288649216",
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,
    }),
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
