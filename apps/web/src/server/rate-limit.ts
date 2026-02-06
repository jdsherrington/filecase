import { and, eq, lt, sql } from "drizzle-orm";

import { db } from "./db/client";
import { rateLimitCounters } from "./db/schema";

function getWindowStart(now: Date, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1000;
  const rounded = Math.floor(now.getTime() / windowMs) * windowMs;
  return new Date(rounded);
}

export async function consumeRateLimit(input: {
  key: string;
  maxAttempts: number;
  windowSeconds: number;
  now?: Date;
}): Promise<{
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}> {
  const now = input.now ?? new Date();
  const windowStart = getWindowStart(now, input.windowSeconds);
  const retryAfterSeconds =
    input.windowSeconds -
    Math.floor((now.getTime() - windowStart.getTime()) / 1000);

  await db
    .delete(rateLimitCounters)
    .where(
      and(
        eq(rateLimitCounters.key, input.key),
        lt(
          rateLimitCounters.windowStart,
          new Date(windowStart.getTime() - input.windowSeconds * 1000 * 10),
        ),
      ),
    );

  const [row] = await db
    .insert(rateLimitCounters)
    .values({
      key: input.key,
      windowStart,
      count: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [rateLimitCounters.key, rateLimitCounters.windowStart],
      set: {
        count: sql`${rateLimitCounters.count} + 1`,
        updatedAt: now,
      },
    })
    .returning({
      count: rateLimitCounters.count,
    });

  const currentCount = row?.count ?? input.maxAttempts + 1;

  if (currentCount > input.maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds,
    remaining: Math.max(input.maxAttempts - currentCount, 0),
  };
}

export function rateLimitErrorMessage(retryAfterSeconds: number): string {
  return `RATE_LIMITED:${retryAfterSeconds}`;
}

export function createRateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(rateLimitErrorMessage(retryAfterSeconds), {
    status: 429,
    headers: {
      "retry-after": String(retryAfterSeconds),
    },
  });
}
