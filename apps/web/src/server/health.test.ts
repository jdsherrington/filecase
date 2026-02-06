import { beforeEach, describe, expect, test, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("./db/client", () => ({
  pool: {
    query: queryMock,
  },
}));

vi.mock("./env", () => ({
  getEnv: () => ({
    HEALTHCHECK_R2_ENABLED: false,
  }),
}));

vi.mock("./logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { getHealthStatus } from "./health";

describe("health checks", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  test("returns ok when database is reachable", async () => {
    queryMock.mockResolvedValue([{ "?column?": 1 }]);

    const result = await getHealthStatus();

    expect(result.status).toBe("ok");
    expect(result.checks.db.ok).toBe(true);
    expect(result.checks.db.error).toBeUndefined();
  });

  test("returns degraded when database check fails", async () => {
    queryMock.mockRejectedValue(new Error("connection refused"));

    const result = await getHealthStatus();

    expect(result.status).toBe("degraded");
    expect(result.checks.db.ok).toBe(false);
    expect(result.checks.db.error).toContain("connection refused");
  });
});
