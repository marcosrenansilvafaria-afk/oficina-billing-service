import { SagaPublisher } from './saga-publisher';

export interface EventoPublicado {
  eventType: string;
  payload: Record<string, unknown>;
  correlationId: string;
}

/**
 * Spy de SagaPublisher para testes unitarios/BDD - so grava os eventos
 * publicados em um array, sem tocar em AWS real.
 */
export class FakeSagaPublisher implements SagaPublisher {
  public readonly eventosPublicados: EventoPublicado[] = [];

  publicar(
    eventType: string,
    payload: Record<string, unknown>,
    correlationId: string,
  ): Promise<void> {
    this.eventosPublicados.push({ eventType, payload, correlationId });
    return Promise.resolve();
  }
}
