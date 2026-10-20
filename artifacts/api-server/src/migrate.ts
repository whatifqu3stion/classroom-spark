import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pool, type PoolClient } from "@workspace/db";

let client: PoolClient | undefined;
try {
  client = await pool.connect();
  await client.query(
    "SELECT pg_advisory_lock(hashtext('boardwork-schema-migrations'))",
  );
  await migrate(drizzle(client), {
    migrationsFolder: path.join(import.meta.dirname, "migrations"),
  });
  console.info("Database migrations complete.");
} catch {
  console.error(
    "Database migration failed. Check database availability and migration history.",
  );
  process.exitCode = 1;
} finally {
  if (client) {
    await client
      .query(
        "SELECT pg_advisory_unlock(hashtext('boardwork-schema-migrations'))",
      )
      .catch(() => {});
    client.release();
  }
  await pool.end();
}
