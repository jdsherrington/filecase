import path from "node:path";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db, pool } from "../src/server/db/client";

const migrationsFolder = path.resolve(import.meta.dir, "../drizzle");

try {
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied.");
} finally {
  await pool.end();
}
