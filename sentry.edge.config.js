Sentry.init({
  dsn: "https://5f394c093e9d41e2a5c5ff3b2ae26a97@o1087651.ingest.sentry.io/6101188",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});