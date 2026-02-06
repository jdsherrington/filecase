import { randomBytes, timingSafeEqual } from "node:crypto";

import { deleteCookie, setCookie } from "@tanstack/react-start/server";
import { and, eq, gt } from "drizzle-orm";

import { db } from "../db/client";
import { sessions, users } from "../db/schema";
import { getEnv } from "../env";
import { getCookieValue } from "./cookies";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type AuthenticatedUser = {
  id: string;
  firmId: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "staff";
  firmName: string;
};

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getCookieOptions() {
  const env = getEnv();
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

function createSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(user: {
  id: string;
  firmId: string;
}): Promise<{ sessionId: string; expiresAt: Date }> {
  const sessionId = createSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    firmId: user.firmId,
    expiresAt,
    lastSeenAt: new Date(),
  });

  const env = getEnv();
  setCookie(env.SESSION_COOKIE_NAME, sessionId, getCookieOptions());

  return { sessionId, expiresAt };
}

export async function getSessionFromRequest(request: Request): Promise<{
  sessionId: string;
  user: AuthenticatedUser;
} | null> {
  const env = getEnv();
  const sessionId = getCookieValue(
    request.headers.get("cookie"),
    env.SESSION_COOKIE_NAME,
  );

  if (!sessionId) {
    return null;
  }

  const now = new Date();

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)),
    with: {
      user: {
        with: {
          firm: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (!secureCompare(session.id, sessionId)) {
    return null;
  }

  await db
    .update(sessions)
    .set({
      lastSeenAt: now,
    })
    .where(eq(sessions.id, session.id));

  return {
    sessionId: session.id,
    user: {
      id: session.user.id,
      firmId: session.user.firmId,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      firmName: session.user.firm.name,
    },
  };
}

export async function requireUser(
  request: Request,
): Promise<AuthenticatedUser> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session.user;
}

export async function logout(request: Request): Promise<void> {
  const env = getEnv();
  const sessionId = getCookieValue(
    request.headers.get("cookie"),
    env.SESSION_COOKIE_NAME,
  );

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  deleteCookie(env.SESSION_COOKIE_NAME, {
    path: "/",
  });
}

export async function updateLastLogin(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function findUserByEmail(email: string): Promise<{
  id: string;
  firmId: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "staff";
  passwordHash: string;
} | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firmId: user.firmId,
    email: user.email,
    name: user.name,
    role: user.role,
    passwordHash: user.passwordHash,
  };
}
