// apps/api/src/auth/guards/clerk.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('CLERK_SECRET_KEY')!;

    if (!this.secretKey) {
      throw new Error('CLERK_SECRET_KEY is not configured.');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const token = this.extractTokenFromHeader(request);

      if (!token) {
        throw new UnauthorizedException('No authentication token provided');
      }

      // Verify the token using the imported verifyToken function
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
      });

      // Attach user information to the request
      request.auth = {
        userId: payload.sub,
        sessionId: payload.sid,
        ...payload,
      };

      return true;
    } catch (error) {
      this.logger.error('Authentication failed:', error.message || error);
      const message =
        error instanceof Error
          ? error.message
          : 'Invalid token or authentication error';
      throw new UnauthorizedException(message);
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    // Check Authorization header for Bearer token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check for token in cookies (common for web apps)
    const sessionToken = request.cookies?.__session;
    if (sessionToken) {
      return sessionToken;
    }

    // Check for custom header
    const customToken = request.headers['x-clerk-token'] as string;
    if (customToken) {
      return customToken;
    }

    return null;
  }
}
