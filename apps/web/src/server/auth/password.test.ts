import { describe, expect, test } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  test("hashes and verifies passwords", async () => {
    const password = "super-secret-password";

    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
