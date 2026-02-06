import { pool } from "./db/client";
import { getEnv } from "./env";
import { logger } from "./logger";

export type HealthStatus = {
  status: "ok" | "degraded";
  checks: {
    db: {
      ok: boolean;
      latencyMs: number;
      error?: string;
    };
    r2?: {
      ok: boolean;
      skipped: boolean;
      reason: string;
    };
  };
  timestamp: string;
};

async function checkDatabase() {
  const startedAt = Date.now();

  try {
    await pool.query("select 1");
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "database check failed",
    };
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const env = getEnv();
  const dbCheck = await checkDatabase();

  if (!dbCheck.ok) {
    logger.error({
      event: "health",
      status: "degraded",
      dbError: dbCheck.error,
    });
  }

  return {
    status: dbCheck.ok ? "ok" : "degraded",
    checks: {
      db: dbCheck,
      r2: env.HEALTHCHECK_R2_ENABLED
        ? {
            ok: true,
            skipped: true,
            reason:
              "R2 connectivity check is disabled in MVP to keep health endpoint fast.",
          }
        : {
            ok: true,
            skipped: true,
            reason: "R2 check disabled by configuration.",
          },
    },
    timestamp: new Date().toISOString(),
  };
}
