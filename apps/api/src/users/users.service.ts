import { Injectable } from '@nestjs/common';
import { db } from '~/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  async getUserByClerkId(clerkUserId: string) {
    const user = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId));
    return user[0];
  }

  async updateUser(clerkUserId: string, updateUserDto: UpdateUserDto) {
    const { firstName, lastName } = updateUserDto;
    const updatedUser = await db.update(users).set({ firstName, lastName }).where(eq(users.clerkUserId, clerkUserId)).returning();
    return updatedUser[0];
  }
}
