import { Orcamento } from '../entities/orcamento';

export interface IOrcamentoRepository {
  save(orcamento: Orcamento): Promise<void>;
  getById(id: string): Promise<Orcamento | null>;
  getByOrdemServicoId(ordemServicoId: string): Promise<Orcamento | null>;
  clear(): Promise<void>;
}
