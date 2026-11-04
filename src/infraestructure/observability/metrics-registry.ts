import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * Registro de metricas Prometheus. Singleton simples (mesmo padrao do
 * oficina-os-service), sem depender do container de DI do Nest.
 */
export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

export const pagamentosAprovadosTotal = new Counter({
  name: 'oficina_billing_pagamentos_aprovados_total',
  help: 'Total de pagamentos aprovados pelo Mercado Pago',
  registers: [metricsRegistry],
});

export const pagamentosRecusadosTotal = new Counter({
  name: 'oficina_billing_pagamentos_recusados_total',
  help: 'Total de pagamentos recusados/expirados pelo Mercado Pago',
  registers: [metricsRegistry],
});

export const reembolsosTotal = new Counter({
  name: 'oficina_billing_reembolsos_total',
  help: 'Total de reembolsos processados (compensacao do Saga por falha de execucao)',
  registers: [metricsRegistry],
});

export const integracaoErrosTotal = new Counter({
  name: 'oficina_integration_errors_total',
  help: 'Total de erros/falhas em integracoes externas (dashboard: taxa de erros e falhas em integracoes)',
  labelNames: ['integracao'],
  registers: [metricsRegistry],
});

export const httpRequestDuracaoSegundos = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duracao das requisicoes HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});
