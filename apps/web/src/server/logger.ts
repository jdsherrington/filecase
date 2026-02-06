import { randomUUID } from "node:crypto";

import pino from "pino";

import { getEnv } from "./env";

const env = getEnv();

export const logger = pino({
  name: "filecase",
  level: env.LOG_LEVEL,
  base: undefined,
});

export type RequestLogScope = {
  requestId: string;
  routeName: string;
  startedAt: number;
};

export function startRequestLog(
  request: Request,
  routeName: string,
): RequestLogScope {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  return {
    requestId,
    routeName,
    startedAt: Date.now(),
  };
}

export function logRequestSuccess(
  scope: RequestLogScope,
  context?: {
    firmId?: string;
    userId?: string;
  },
) {
  logger.info({
    event: "request",
    outcome: "success",
    requestId: scope.requestId,
    routeName: scope.routeName,
    durationMs: Date.now() - scope.startedAt,
    firmId: context?.firmId,
    userId: context?.userId,
  });
}

export function logRequestFailure(
  scope: RequestLogScope,
  error: unknown,
  context?: {
    firmId?: string;
    userId?: string;
  },
) {
  logger.error({
    event: "request",
    outcome: "error",
    requestId: scope.requestId,
    routeName: scope.routeName,
    durationMs: Date.now() - scope.startedAt,
    firmId: context?.firmId,
    userId: context?.userId,
    error: error instanceof Error ? error.message : "Unknown error",
  });
}
