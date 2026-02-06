import { loginSchema } from "@filecase/shared";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getAuditRequestContext, logAuditEvent } from "../audit";
import { listClientsForUser } from "../clients";
import { getEnv } from "../env";
import {
  logRequestFailure,
  logRequestSuccess,
  startRequestLog,
} from "../logger";
import { consumeRateLimit, createRateLimitResponse } from "../rate-limit";
import { canListClients } from "../rbac/permissions";
import { resolveTenantContext } from "../tenant/context";
import { loginWithPassword } from "./service";
import { getSessionFromRequest, logout } from "./session";

export const getCurrentUserServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const scope = startRequestLog(request, "auth.getCurrentUser");

    try {
      const session = await getSessionFromRequest(request);

      if (!session) {
        logRequestSuccess(scope);
        return null;
      }

      logRequestSuccess(scope, {
        firmId: session.user.firmId,
        userId: session.user.id,
      });
      return session.user;
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  },
);

export const loginServerFn = createServerFn({ method: "POST" })
  .inputValidator(loginSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "auth.login");
    const requestContext = getAuditRequestContext(request);
    const env = getEnv();
    const ipKey = requestContext.ip ?? "unknown";
    const emailKey = data.email.toLowerCase();

    const ipLimit = await consumeRateLimit({
      key: `login:ip:${ipKey}`,
      maxAttempts: env.RATE_LIMIT_LOGIN_IP_MAX_ATTEMPTS,
      windowSeconds: env.RATE_LIMIT_LOGIN_IP_WINDOW_SECONDS,
    });

    if (!ipLimit.allowed) {
      throw createRateLimitResponse(ipLimit.retryAfterSeconds);
    }

    const emailLimit = await consumeRateLimit({
      key: `login:email:${emailKey}`,
      maxAttempts: env.RATE_LIMIT_LOGIN_EMAIL_MAX_ATTEMPTS,
      windowSeconds: env.RATE_LIMIT_LOGIN_EMAIL_WINDOW_SECONDS,
    });

    if (!emailLimit.allowed) {
      throw createRateLimitResponse(emailLimit.retryAfterSeconds);
    }

    try {
      const loginResult = await loginWithPassword(data);

      if (!loginResult) {
        throw new Error("INVALID_CREDENTIALS");
      }

      await logAuditEvent({
        firmId: loginResult.firmId,
        userId: loginResult.userId,
        action: "auth.login",
        entityType: "user",
        entityId: loginResult.userId,
        metadata: {
          role: loginResult.role,
        },
        requestContext,
      });

      logRequestSuccess(scope, {
        firmId: loginResult.firmId,
        userId: loginResult.userId,
      });
      return {
        ok: true,
      };
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  });

export const logoutServerFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const request = getRequest();
    const scope = startRequestLog(request, "auth.logout");
    const requestContext = getAuditRequestContext(request);
    try {
      const session = await getSessionFromRequest(request);

      if (session) {
        await logAuditEvent({
          firmId: session.user.firmId,
          userId: session.user.id,
          action: "auth.logout",
          entityType: "session",
          entityId: session.sessionId,
          requestContext,
        });
      }

      await logout(request);

      logRequestSuccess(scope, {
        firmId: session?.user.firmId,
        userId: session?.user.id,
      });
      return {
        ok: true,
      };
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  },
);

export const listClientsServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const scope = startRequestLog(request, "clients.list");
    try {
      const tenant = await resolveTenantContext(request);

      if (!canListClients(tenant.user)) {
        throw new Error("FORBIDDEN");
      }

      const rows = await listClientsForUser(tenant.user);
      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        externalReference: row.externalReference,
        createdAt: row.createdAt.toISOString(),
      }));
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  },
);
