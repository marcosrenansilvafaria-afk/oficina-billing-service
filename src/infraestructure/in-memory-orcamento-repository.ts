import { Orcamento } from '../domain/entities/orcamento';
import { IOrcamentoRepository } from '../domain/repositories/orcamento-repository.interface';

export class InMemoryOrcamentoRepository implements IOrcamentoRepository {
  private items = new Map<string, Orcamento>();

  save(orcamento: Orcamento): Promise<void> {
    this.items.set(orcamento.id, orcamento);
    return Promise.resolve();
  }

  getById(id: string): Promise<Orcamento | null> {
    return Promise.resolve(this.items.get(id) ?? null);
  }

  getByOrdemServicoId(ordemServicoId: string): Promise<Orcamento | null> {
    for (const orcamento of this.items.values()) {
      if (orcamento.ordemServicoId === ordemServicoId) {
        return Promise.resolve(orcamento);
      }
    }
    return Promise.resolve(null);
  }

  clear(): Promise<void> {
    this.items.clear();
    return Promise.resolve();
  }
}
