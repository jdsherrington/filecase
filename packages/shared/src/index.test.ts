import { describe, expect, test } from "bun:test";

import { documentCategorySchema } from "./index";

describe("documentCategorySchema", () => {
  test("accepts valid categories", () => {
    expect(documentCategorySchema.parse("invoice")).toBe("invoice");
  });

  test("rejects invalid categories", () => {
    expect(() => documentCategorySchema.parse("other")).toThrow();
  });
});
