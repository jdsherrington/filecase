import { describe, expect, test } from "bun:test";

import { cn } from "./lib-utils";

describe("cn", () => {
  test("merges tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
