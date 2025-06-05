// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { WebhooksController } from './controllers/webhooks.controller';

@Module({
  providers: [AuthService],
  exports: [AuthService],
  controllers: [WebhooksController],
})
export class AuthModule {}
