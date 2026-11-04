import { Pagamento } from '../entities/pagamento';

export interface IPagamentoRepository {
  save(pagamento: Pagamento): Promise<void>;
  getById(id: string): Promise<Pagamento | null>;
  getByOrdemServicoId(ordemServicoId: string): Promise<Pagamento | null>;
  getByMercadoPagoPaymentId(
    mercadoPagoPaymentId: string,
  ): Promise<Pagamento | null>;
  clear(): Promise<void>;
}
