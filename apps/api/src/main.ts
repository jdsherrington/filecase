// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Import
import { Logger, ValidationPipe } from '@nestjs/common'; // Import Logger

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // bodyParser: false, // Important for raw body with Svix if not using a global pipe that parses JSON
  });
  const logger = new Logger('Bootstrap'); // Create a logger instance

  // Enable raw body parsing for specific routes if needed, or globally if careful
  // For Svix webhooks, you need the raw body.
  // If you use a global ValidationPipe or other middleware that parses JSON,
  // you might need to configure it to preserve the raw body for the webhook route.
  // A common approach is to use `express.raw({ type: 'application/json' })`
  // specifically for the webhook route or use a custom body parser.
  // For now, let's assume NestJS default JSON parsing is okay and Svix handles string conversion.
  // If issues arise, this is the place to look.

  app.enableCors(); // Basic CORS for development

  // Global validation pipe (optional for now, but good practice)
  // app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('My Doc Mgmt API')
    .setDescription('API for the document management application')
    .setVersion('1.0')
    .addBearerAuth() // For JWT from Clerk
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Serve docs at /api-docs

  const port = process.env.PORT || 3001; // Backend on 3001
  await app.listen(port);
  logger.log(`API listening on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api-docs`);
}
bootstrap();
