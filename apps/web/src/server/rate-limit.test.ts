import { beforeEach, describe, expect, test, vi } from "vitest";

const { deleteWhereMock, returningMock } = vi.hoisted(() => ({
  deleteWhereMock: vi.fn(),
  returningMock: vi.fn(),
}));

vi.mock("./db/client", () => ({
  db: {
    delete: vi.fn(() => ({
      where: deleteWhereMock,
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => ({
          returning: returningMock,
        })),
      })),
    })),
  },
}));

import {
  consumeRateLimit,
  createRateLimitResponse,
  rateLimitErrorMessage,
} from "./rate-limit";

describe("rate limiter", () => {
  beforeEach(() => {
    deleteWhereMock.mockReset();
    returningMock.mockReset();
  });

  test("allows requests within threshold", async () => {
    returningMock.mockResolvedValue([{ count: 1 }]);

    const result = await consumeRateLimit({
      key: "login:ip:127.0.0.1",
      maxAttempts: 5,
      windowSeconds: 60,
      now: new Date("2026-02-06T12:00:00.000Z"),
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  test("blocks requests over threshold", async () => {
    returningMock.mockResolvedValue([{ count: 6 }]);

    const result = await consumeRateLimit({
      key: "login:email:admin@demo.local",
      maxAttempts: 5,
      windowSeconds: 60,
      now: new Date("2026-02-06T12:00:30.000Z"),
    });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  test("formats rate limit error messages", () => {
    expect(rateLimitErrorMessage(45)).toBe("RATE_LIMITED:45");
  });

  test("creates a 429 response with retry-after", () => {
    const response = createRateLimitResponse(30);

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
  });
});
