import { defineConfig } from "drizzle-kit";

import { getEnv } from "./src/server/env";

const env = getEnv();

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
