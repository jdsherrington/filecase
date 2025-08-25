import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk.guard';

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@GetUser('sub') clerkUserId: string) {
    return this.usersService.getUserByClerkId(clerkUserId);
  }

  @Patch('me')
  updateMe(
    @GetUser('sub') clerkUserId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(clerkUserId, updateUserDto);
  }
}
