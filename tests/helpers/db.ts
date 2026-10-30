/**
 * Guard for database tests. They only run when RUN_DB_TESTS=1 AND
 * TEST_DATABASE_URL points to a local database — never the live site.
 * (Website 2 ran its tests against production; we don't.)
 */
const url = process.env.TEST_DATABASE_URL ?? "";
const local = /@(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//.test(url);

export const dbTestsEnabled = process.env.RUN_DB_TESTS === "1" && local;

if (process.env.RUN_DB_TESTS === "1" && !local) {
  throw new Error("TEST_DATABASE_URL must point to a local test database (localhost). Refusing to run DB tests.");
}
if (dbTestsEnabled) process.env.DATABASE_URL = url;
