import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { WebhookMercadoPagoController } from './interfaces/http/webhook-mercadopago.controller';
import { PagamentoController } from './interfaces/http/pagamento.controller';
import { TestMercadoPagoController } from './interfaces/http/test-mercadopago.controller';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './infraestructure/observability/logger.module';
import { MetricsController } from './infraestructure/observability/metrics.controller';
import { HealthController } from './infraestructure/observability/health.controller';
import { HttpMetricsInterceptor } from './infraestructure/observability/http-metrics.interceptor';
import { AllExceptionsFilter } from './infraestructure/observability/all-exceptions.filter';
import { SagaModule } from './infraestructure/saga/saga.module';

@Module({
  imports: [LoggerModule, AuthModule, TerminusModule, SagaModule],
  controllers: [
    WebhookMercadoPagoController,
    PagamentoController,
    TestMercadoPagoController,
    MetricsController,
    HealthController,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
