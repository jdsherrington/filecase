// apps/api/drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' }); // Ensure .env is loaded

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // Specifies the database system
  // driver: 'pg', // <--- REMOVE THIS LINE
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!, // Drizzle infers usage of 'pg' driver from this with dialect
  },
  verbose: true,
  strict: true,
} satisfies Config;
