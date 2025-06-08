import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  _experiments: {
    enableLogs: true,
  },

  debug: false,

  tracesSampleRate: 1.0,
});
