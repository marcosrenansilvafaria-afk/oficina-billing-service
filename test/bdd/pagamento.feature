# language: pt
Funcionalidade: Pagamento via Mercado Pago no Saga coreografado

  Cenario: Pagamento aprovado
    Dado um orcamento gerado para a ordem de servico "os-1"
    Quando o webhook do Mercado Pago confirma o pagamento
    Entao o pagamento da ordem de servico deve estar "APROVADO"
    E o evento PagamentoAprovadoEvent deve ter sido publicado

  Cenario: Compensacao - estorno por falha de execucao
    Dado um pagamento aprovado para a ordem de servico "os-1"
    Quando o evento CompensarOSEvent com origem "EXECUCAO" e recebido
    Entao o pagamento da ordem de servico deve estar "REEMBOLSADO"
