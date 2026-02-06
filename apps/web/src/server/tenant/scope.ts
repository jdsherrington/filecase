import { type AnyColumn, type SQL, and, eq } from "drizzle-orm";

export function withFirmScope(
  firmIdColumn: AnyColumn,
  firmId: string,
  predicate?: SQL<unknown>,
): SQL<unknown> {
  const firmCondition = eq(firmIdColumn, firmId);

  if (!predicate) {
    return firmCondition;
  }

  return and(firmCondition, predicate) as SQL<unknown>;
}
