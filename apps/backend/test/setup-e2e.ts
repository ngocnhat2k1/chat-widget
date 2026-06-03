import { TEST_DATABASE_URL } from "./test-env";

// Runs (setupFiles) before the test file imports AppModule, so these win over
// .env: @nestjs/config does NOT override process.env vars that are already set.
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "e2e-test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";
process.env.NODE_ENV = "test";
