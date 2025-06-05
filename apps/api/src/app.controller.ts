// apps/api/src/app.controller.ts
import {
  Controller,
  Get,
  UseGuards,
  Req,
  UnauthorizedException, // <<<--- ADD THIS IMPORT
} from '@nestjs/common'; // <<<--- Ensure it's from here
import { AppService } from './app.service';
import { ClerkAuthGuard } from './auth/guards/clerk.guard';
import { Request } from 'express'; // Express Request is augmented by the guard
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Default')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get a hello message' })
  @ApiResponse({ status: 200, description: 'Returns a hello string.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a protected hello message' })
  @ApiResponse({
    status: 200,
    description: 'Returns a protected hello string for the authenticated user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get('protected')
  getProtectedHello(@Req() req: Request): string {
    // req.auth and req.userId are now typed via declaration merging
    if (!req.auth || !req.auth.userId) {
      // Now UnauthorizedException will be found
      throw new UnauthorizedException('User not properly authenticated');
    }
    return `Hello from protected route, user ID: ${req.auth.userId}!`;
  }
}
