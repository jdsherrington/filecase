import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  setCookieMock,
  deleteCookieMock,
  insertValuesMock,
  deleteWhereMock,
  updateWhereMock,
  findSessionMock,
} = vi.hoisted(() => ({
  setCookieMock: vi.fn(),
  deleteCookieMock: vi.fn(),
  insertValuesMock: vi.fn(),
  deleteWhereMock: vi.fn(),
  updateWhereMock: vi.fn(),
  findSessionMock: vi.fn(),
}));

vi.mock("@tanstack/react-start/server", () => ({
  setCookie: setCookieMock,
  deleteCookie: deleteCookieMock,
}));

vi.mock("../env", () => ({
  getEnv: () => ({
    DATABASE_URL: "postgres://test",
    SESSION_COOKIE_NAME: "filecase_session",
    SESSION_SECRET: "test-secret-123456789",
    APP_ORIGIN: "http://localhost:3000",
    NODE_ENV: "test",
    SEED_ADMIN_EMAIL: "admin@demo.local",
    SEED_ADMIN_PASSWORD: "change-me-now",
  }),
}));

vi.mock("../db/client", () => ({
  db: {
    insert: vi.fn(() => ({
      values: insertValuesMock,
    })),
    query: {
      sessions: {
        findFirst: findSessionMock,
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: updateWhereMock,
      })),
    })),
    delete: vi.fn(() => ({
      where: deleteWhereMock,
    })),
  },
}));

import { createSession, getSessionFromRequest, logout } from "./session";

describe("session lifecycle", () => {
  beforeEach(() => {
    setCookieMock.mockReset();
    deleteCookieMock.mockReset();
    insertValuesMock.mockReset();
    deleteWhereMock.mockReset();
    updateWhereMock.mockReset();
    findSessionMock.mockReset();
  });

  test("createSession inserts a session and sets cookie", async () => {
    insertValuesMock.mockResolvedValue(undefined);

    const result = await createSession({
      id: "user-1",
      firmId: "firm-1",
    });

    expect(result.sessionId).toBeTypeOf("string");
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(setCookieMock).toHaveBeenCalledTimes(1);
    expect(insertValuesMock).toHaveBeenCalledTimes(1);
  });

  test("getSessionFromRequest returns null for expired sessions", async () => {
    findSessionMock.mockResolvedValue(null);

    const request = new Request("http://localhost", {
      headers: {
        cookie: "filecase_session=session-id",
      },
    });

    const session = await getSessionFromRequest(request);

    expect(session).toBeNull();
  });

  test("getSessionFromRequest updates last_seen_at for active sessions", async () => {
    findSessionMock.mockResolvedValue({
      id: "session-id",
      user: {
        id: "user-1",
        firmId: "firm-1",
        email: "admin@demo.local",
        name: "Demo Admin",
        role: "admin",
        firm: {
          name: "Demo Firm",
        },
      },
    });

    const request = new Request("http://localhost", {
      headers: {
        cookie: "filecase_session=session-id",
      },
    });

    const session = await getSessionFromRequest(request);

    expect(session?.user.firmName).toBe("Demo Firm");
    expect(updateWhereMock).toHaveBeenCalledTimes(1);
  });

  test("logout clears cookie and deletes session", async () => {
    deleteWhereMock.mockResolvedValue(undefined);

    const request = new Request("http://localhost", {
      headers: {
        cookie: "filecase_session=session-id",
      },
    });

    await logout(request);

    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(deleteCookieMock).toHaveBeenCalledTimes(1);
  });
});
