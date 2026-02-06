import { describe, expect, test, vi } from "vitest";

const { createSessionMock, findUserByEmailMock, updateLastLoginMock } =
  vi.hoisted(() => ({
    createSessionMock: vi.fn(),
    findUserByEmailMock: vi.fn(),
    updateLastLoginMock: vi.fn(),
  }));

vi.mock("./session", () => ({
  createSession: createSessionMock,
  findUserByEmail: findUserByEmailMock,
  updateLastLogin: updateLastLoginMock,
}));

import { hashPassword } from "./password";
import { loginWithPassword } from "./service";

describe("auth flow smoke", () => {
  test("login creates session and updates last login", async () => {
    const password = "super-secret-password";
    const passwordHash = await hashPassword(password);

    findUserByEmailMock.mockResolvedValue({
      id: "user-1",
      firmId: "firm-1",
      email: "admin@demo.local",
      name: "Demo Admin",
      role: "admin",
      passwordHash,
    });

    const result = await loginWithPassword({
      email: "admin@demo.local",
      password,
    });

    expect(result).toEqual({
      userId: "user-1",
      firmId: "firm-1",
      role: "admin",
    });
    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(updateLastLoginMock).toHaveBeenCalledTimes(1);
  });
});
