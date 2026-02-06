import { db } from "./db/client";
import { auditLogs } from "./db/schema";

export type AuditRequestContext = {
  ip?: string;
  userAgent?: string;
};

export function getAuditRequestContext(request: Request): AuditRequestContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim() || undefined;
  const ip = realIp ?? firstForwardedIp;

  return {
    ip,
    userAgent,
  };
}

export async function logAuditEvent(input: {
  firmId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  requestContext?: AuditRequestContext;
}): Promise<void> {
  const metadata: Record<string, unknown> = {
    ...(input.metadata ?? {}),
  };

  if (input.requestContext?.ip) {
    metadata.request_ip = input.requestContext.ip;
  }

  if (input.requestContext?.userAgent) {
    metadata.request_user_agent = input.requestContext.userAgent;
  }

  await db.insert(auditLogs).values({
    firmId: input.firmId,
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata,
  });
}
