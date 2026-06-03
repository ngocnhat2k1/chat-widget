import { execSync } from "child_process";
import { TEST_DATABASE_URL } from "./test-env";

// Once per run: create (if missing) + sync the schema on the test database so
// the suite always runs against the current Prisma schema. `db push` creates
// the database itself when it doesn't exist, so no manual provisioning needed.
export default async function globalSetup(): Promise<void> {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
