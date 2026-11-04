import 'dotenv/config';
import type { Server } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { useRealIntegrations } from './infraestructure/singletons';

async function bootstrap() {
  if (process.env.USE_REAL_INTEGRATIONS !== 'false') {
    useRealIntegrations();
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Oficina Billing Service API')
    .setDescription(
      'Microsservico de orcamento/pagamento (Mercado Pago) - Fase 4, Saga coreografado',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  app.enableShutdownHooks();

  (await app.listen(process.env.PORT ?? 3000)) as Server;
}
bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Erro desconhecido ao iniciar API';
  console.error(message);
  process.exit(1);
});
