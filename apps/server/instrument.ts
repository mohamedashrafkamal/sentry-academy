import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://3a9b93c0dffb8559153ce45a04fcbc50@o4508130833793024.ingest.us.sentry.io/4509441326120960',

  _experiments: {
    enableLogs: true,
  },

  debug: true,

  tracesSampleRate: 1.0,
});
