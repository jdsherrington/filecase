import { describe, expect, test } from "vitest";

import { documentCategorySchema } from "@filecase/shared";

describe("workspace imports", () => {
  test("loads shared schema in web app tests", () => {
    expect(documentCategorySchema.parse("receipt")).toBe("receipt");
  });
});
