// Single source of truth for the e2e database URL. CI overrides it with
// DATABASE_URL_TEST (its own Postgres service); locally it points at a
// dedicated `chat_widget_test` DB on the docker-compose Postgres — never the
// dev database, so running e2e can't clobber dev data.
export const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  "postgresql://chatuser:chatpass123@localhost:5432/chat_widget_test";
