import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from "react-router-dom";

Sentry.init({
  dsn: "https://2cb8a9a7351068cebf07a5257ccca923@o4508130833793024.ingest.us.sentry.io/4509452972130304",

  
  sendDefaultPii: true,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.consoleLoggingIntegration(),
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
