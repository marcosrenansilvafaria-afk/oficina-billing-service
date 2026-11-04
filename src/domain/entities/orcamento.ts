export type TipoItemOrcamento = 'SERVICO' | 'PECA';

export interface ItemOrcamento {
  descricao: string;
  tipo: TipoItemOrcamento;
  preco: number;
  quantidade: number;
}

/**
 * Copia local do orcamento gerado pelo OS Service (OrcamentoGeradoEvent),
 * mantida aqui para auditoria/consulta - o Billing Service nunca recalcula
 * nem corrige o valor, apenas registra o que recebeu.
 */
export class Orcamento {
  constructor(
    public readonly id: string,
    public readonly ordemServicoId: string,
    public readonly valorTotal: number,
    public readonly itens: ItemOrcamento[],
    public readonly recebidoEm: Date = new Date(),
  ) {}
}
