import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  throw new Error(
    "Configure DATABASE_URL or standard PostgreSQL PGHOST/PGUSER/PGDATABASE settings.",
  );
}

export const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined);
export const db = drizzle(pool, { schema });

export * from "./schema";
export type { PoolClient } from "pg";
