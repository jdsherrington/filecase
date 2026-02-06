import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "../env";
import * as schema from "./schema";

const env = getEnv();

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
});

export const db = drizzle(pool, { schema });
export { pool };
