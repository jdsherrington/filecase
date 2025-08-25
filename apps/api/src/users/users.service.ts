import { Injectable } from '@nestjs/common';
import { db } from '~/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  async getUserByClerkId(clerkId: string) {
    const user = await db.select().from(users).where(eq(users.clerkId, clerkId));
    return user[0];
  }

  async updateUser(clerkId: string, updateUserDto: UpdateUserDto) {
    const { firstName, lastName } = updateUserDto;
    const updatedUser = await db.update(users).set({ firstname: firstName, lastname: lastName }).where(eq(users.clerkId, clerkId)).returning();
    return updatedUser[0];
  }
}
