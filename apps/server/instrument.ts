import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://acd6ccaeaf2f6276e3608e8f9e62debd@o4509480252735488.ingest.us.sentry.io/4509497275056128",
  _experiments: {
    enableLogs: true,
  },
  debug: true,
  tracesSampleRate: 1.0,
});
