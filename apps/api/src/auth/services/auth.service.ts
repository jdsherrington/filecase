import { Injectable } from '@nestjs/common';
import { db } from '~/db';
import { users } from '~/db/schema';

@Injectable()
export class AuthService {
  async createUserFromClerk(clerkId: string, email: string) {
    await db.insert(users).values({
      clerkId,
      email,
    });
  }
}
