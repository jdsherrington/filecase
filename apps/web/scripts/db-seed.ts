import { and, eq } from "drizzle-orm";

import { hashPassword } from "../src/server/auth/password";
import { db, pool } from "../src/server/db/client";
import {
  clientAssignments,
  clients,
  engagementAssignments,
  engagements,
  firms,
  users,
} from "../src/server/db/schema";
import { getEnv } from "../src/server/env";

const env = getEnv();
const DEMO_FIRM_NAME = "Demo Firm";
const MANAGER_EMAIL = "manager@demo.local";
const STAFF_EMAIL = "staff@demo.local";

async function ensureFirm() {
  const existing = await db.query.firms.findFirst({
    where: eq(firms.name, DEMO_FIRM_NAME),
  });

  if (existing) {
    return existing;
  }

  const [firm] = await db
    .insert(firms)
    .values({ name: DEMO_FIRM_NAME })
    .returning();

  if (!firm) {
    throw new Error("Failed to create demo firm.");
  }

  return firm;
}

async function ensureUser(input: {
  firmId: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "staff";
  password: string;
}) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existing) {
    return existing;
  }

  const passwordHash = await hashPassword(input.password);

  const [user] = await db
    .insert(users)
    .values({
      firmId: input.firmId,
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
    })
    .returning();

  if (!user) {
    throw new Error(`Failed to create user ${input.email}.`);
  }

  return user;
}

async function ensureClient(
  firmId: string,
  name: string,
  externalReference: string,
) {
  const existing = await db.query.clients.findFirst({
    where: and(eq(clients.firmId, firmId), eq(clients.name, name)),
  });

  if (existing) {
    return existing;
  }

  const [client] = await db
    .insert(clients)
    .values({
      firmId,
      name,
      externalReference,
      status: "active",
    })
    .returning();

  if (!client) {
    throw new Error(`Failed to create client ${name}.`);
  }

  return client;
}

async function ensureEngagement(
  firmId: string,
  clientId: string,
  name: string,
  financialYear: number,
) {
  const existing = await db.query.engagements.findFirst({
    where: and(
      eq(engagements.firmId, firmId),
      eq(engagements.clientId, clientId),
      eq(engagements.name, name),
    ),
  });

  if (existing) {
    return existing;
  }

  const [engagement] = await db
    .insert(engagements)
    .values({
      firmId,
      clientId,
      name,
      financialYear,
      status: "open",
    })
    .returning();

  if (!engagement) {
    throw new Error(`Failed to create engagement ${name}.`);
  }

  return engagement;
}

async function ensureClientAssignment(input: {
  firmId: string;
  clientId: string;
  userId: string;
  createdByUserId: string;
}) {
  const existing = await db.query.clientAssignments.findFirst({
    where: and(
      eq(clientAssignments.firmId, input.firmId),
      eq(clientAssignments.clientId, input.clientId),
      eq(clientAssignments.userId, input.userId),
    ),
  });

  if (existing) {
    return existing;
  }

  const [assignment] = await db
    .insert(clientAssignments)
    .values({
      firmId: input.firmId,
      clientId: input.clientId,
      userId: input.userId,
      createdByUserId: input.createdByUserId,
    })
    .returning();

  if (!assignment) {
    throw new Error("Failed to create client assignment.");
  }

  return assignment;
}

async function ensureEngagementAssignment(input: {
  firmId: string;
  engagementId: string;
  userId: string;
  createdByUserId: string;
}) {
  const existing = await db.query.engagementAssignments.findFirst({
    where: and(
      eq(engagementAssignments.firmId, input.firmId),
      eq(engagementAssignments.engagementId, input.engagementId),
      eq(engagementAssignments.userId, input.userId),
    ),
  });

  if (existing) {
    return existing;
  }

  const [assignment] = await db
    .insert(engagementAssignments)
    .values({
      firmId: input.firmId,
      engagementId: input.engagementId,
      userId: input.userId,
      createdByUserId: input.createdByUserId,
    })
    .returning();

  if (!assignment) {
    throw new Error("Failed to create engagement assignment.");
  }

  return assignment;
}

try {
  const firm = await ensureFirm();

  const admin = await ensureUser({
    firmId: firm.id,
    email: env.SEED_ADMIN_EMAIL,
    name: "Demo Admin",
    role: "admin",
    password: env.SEED_ADMIN_PASSWORD,
  });

  const manager = await ensureUser({
    firmId: firm.id,
    email: MANAGER_EMAIL,
    name: "Demo Manager",
    role: "manager",
    password: env.SEED_ADMIN_PASSWORD,
  });

  const staff = await ensureUser({
    firmId: firm.id,
    email: STAFF_EMAIL,
    name: "Demo Staff",
    role: "staff",
    password: env.SEED_ADMIN_PASSWORD,
  });

  const clientA = await ensureClient(firm.id, "Acme Manufacturing", "ACME-001");
  const clientB = await ensureClient(firm.id, "Northwind Services", "NW-100");

  const engagementA = await ensureEngagement(
    firm.id,
    clientA.id,
    "FY2025 Compliance",
    2025,
  );
  await ensureEngagement(firm.id, clientB.id, "FY2025 Advisory", 2025);

  await ensureClientAssignment({
    firmId: firm.id,
    clientId: clientA.id,
    userId: staff.id,
    createdByUserId: admin.id,
  });

  await ensureEngagementAssignment({
    firmId: firm.id,
    engagementId: engagementA.id,
    userId: staff.id,
    createdByUserId: manager.id,
  });

  console.log("Seed completed.");
  console.log(`Admin email: ${env.SEED_ADMIN_EMAIL}`);
  console.log(`Manager email: ${MANAGER_EMAIL}`);
  console.log(`Staff email: ${STAFF_EMAIL}`);
  console.log("All seed user passwords are sourced from SEED_ADMIN_PASSWORD.");
} finally {
  await pool.end();
}
