// apps/api/src/auth/controllers/webhooks.controller.ts
import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  HttpCode,
} from '@nestjs/common';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service'; // Assuming you'll add logic here
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';

// Define the expected payload structure from Clerk (can be refined)
interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string; // Add other types as needed
  data: Record<string, any>;
  object: 'event';
}

@ApiTags('Auth Webhooks') // Tag for Swagger UI
@Controller('auth/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private wh: Webhook;

  constructor(
    private configService: ConfigService,
    private authService: AuthService, // Inject AuthService
  ) {
    const secret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn(
        'CLERK_WEBHOOK_SECRET is not set. Webhook verification will fail.',
      );
      // In a real app, you might throw or prevent startup
    }
    this.wh = new Webhook(secret || 'dummy_secret_if_not_set_for_dev'); // Handle missing secret gracefully for init
  }

  @Post('clerk')
  @HttpCode(200) // Clerk expects 200 for success, even if no body is returned
  @ApiOperation({ summary: 'Handle incoming Clerk webhooks' })
  @ApiHeader({
    name: 'svix-id',
    required: true,
    description: 'Svix message ID',
  })
  @ApiHeader({
    name: 'svix-timestamp',
    required: true,
    description: 'Svix message timestamp',
  })
  @ApiHeader({
    name: 'svix-signature',
    required: true,
    description: 'Svix message signature',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook received and verified (or processing started).',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g., missing headers, verification failed).',
  })
  async handleClerkWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Body() payload: ClerkWebhookEvent | string,
  ) {
    // ... (rest of the logic)
    this.logger.log('Received Clerk webhook via /auth/webhooks/clerk');
    // ...
    return { received: true };
  }
}
