
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OrgsService } from './orgs.service';
import { ClerkAuthGuard } from '../auth/guards/clerk.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { createOrganizationSchema } from './dto/create-organization.dto';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  async createOrganization(
    @GetUser('sub') userId: string,
    @Body() body,
  ) {
    const { name } = createOrganizationSchema.parse(body);
    return this.orgsService.createOrganization(userId, { name });
  }

  @Get('check')
  @UseGuards(ClerkAuthGuard)
  async checkUserOrgMembership(@GetUser('sub') userId: string) {
    return this.orgsService.checkUserOrgMembership(userId);
  }

  @Post(':orgId/access')
  @UseGuards(ClerkAuthGuard)
  async updateLastAccessed(
    @GetUser('sub') userId: string,
    @Param('orgId') orgId: string,
  ) {
    return this.orgsService.updateLastAccessed(userId, orgId);
  }
}
