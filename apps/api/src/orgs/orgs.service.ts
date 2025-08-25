import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { and, desc, eq } from 'drizzle-orm';
import { orgs, usersorgs } from '../db/schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrgsService {
  async createOrganization(userId: string, data: CreateOrganizationDto) {
    const [newOrg] = await db
      .insert(orgs)
      .values({ name: data.name })
      .returning();

    await db.insert(usersorgs).values({
      userId,
      orgId: newOrg.id,
      role: 'admin',
    });

    return newOrg;
  }

  async checkUserOrgMembership(userId: string) {
    const [userOrg] = await db.query.usersorgs.findMany({
      where: eq(usersorgs.userId, userId),
      orderBy: [desc(usersorgs.lastAccessed)],
      limit: 1,
    });

    return { hasOrg: !!userOrg, orgId: userOrg?.orgId };
  }

  async updateLastAccessed(userId: string, orgId: string) {
    await db
      .update(usersorgs)
      .set({ lastAccessed: new Date().toISOString() })
      .where(and(eq(usersorgs.userId, userId), eq(usersorgs.orgId, orgId)));
  }
}
