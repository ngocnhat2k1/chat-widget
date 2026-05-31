import * as Sentry from "@sentry/node";

// Initialised as early as possible (imported first in main.ts). No-op when
// SENTRY_DSN is unset, so local/dev runs need no configuration.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0,
  });
}
