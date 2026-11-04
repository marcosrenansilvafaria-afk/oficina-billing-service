import { Pagamento } from '../domain/entities/pagamento';
import { IPagamentoRepository } from '../domain/repositories/pagamento-repository.interface';

export class InMemoryPagamentoRepository implements IPagamentoRepository {
  private items = new Map<string, Pagamento>();

  save(pagamento: Pagamento): Promise<void> {
    this.items.set(pagamento.id, pagamento);
    return Promise.resolve();
  }

  getById(id: string): Promise<Pagamento | null> {
    return Promise.resolve(this.items.get(id) ?? null);
  }

  getByOrdemServicoId(ordemServicoId: string): Promise<Pagamento | null> {
    for (const pagamento of this.items.values()) {
      if (pagamento.ordemServicoId === ordemServicoId) {
        return Promise.resolve(pagamento);
      }
    }
    return Promise.resolve(null);
  }

  getByMercadoPagoPaymentId(
    mercadoPagoPaymentId: string,
  ): Promise<Pagamento | null> {
    for (const pagamento of this.items.values()) {
      if (pagamento.getMercadoPagoPaymentId() === mercadoPagoPaymentId) {
        return Promise.resolve(pagamento);
      }
    }
    return Promise.resolve(null);
  }

  clear(): Promise<void> {
    this.items.clear();
    return Promise.resolve();
  }
}
