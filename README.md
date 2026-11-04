# oficina-billing-service

Segundo microsserviço da Fase 4 do Tech Challenge. Responsável por
orçamento/pagamento e integração com o **Mercado Pago** (PIX/Checkout +
Webhooks). Dono exclusivo de um banco **NoSQL (DynamoDB)** — nenhum outro
serviço acessa essas tabelas diretamente.

| Repositório | Papel |
|---|---|
| [oficina-messaging-infra](https://github.com/marcosrenansilvafaria-afk/oficina-messaging-infra) | Broker SNS/SQS FIFO + contratos de evento do Saga |
| [oficina-os-service](https://github.com/marcosrenansilvafaria-afk/oficina-os-service) | Microsserviço de Ordem de Serviço |
| **oficina-billing-service** (este) | Microsserviço de orçamento/pagamento |

## Sumário

- [Propósito](#propósito)
- [Fluxo (diagrama de sequência)](#fluxo-diagrama-de-sequência)
- [Saga Pattern — consome e publica](#saga-pattern--consome-e-publica)
- [Banco de dados (DynamoDB)](#banco-de-dados-dynamodb)
- [Módulo Mercado Pago](#módulo-mercado-pago)
- [Execução local](#execução-local)
- [Swagger / OpenAPI](#swagger--openapi)
- [Testes e cobertura](#testes-e-cobertura)
- [Deploy no EKS](#deploy-no-eks)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Pendências conhecidas](#pendências-conhecidas)

## Propósito

Receber o orçamento gerado pelo OS Service, abrir a cobrança no Mercado
Pago, processar os webhooks de notificação de pagamento com segurança
(validação de assinatura) e reagir a falhas do Saga estornando pagamentos
já aprovados quando a execução do reparo falha depois do fato.

## Fluxo (diagrama de sequência)

```mermaid
sequenceDiagram
    participant OS as OS Service
    participant Topic as SNS FIFO<br/>oficina-saga-events.fifo
    participant Billing as Billing Service (este)
    participant MP as Mercado Pago

    OS->>Topic: OrcamentoGeradoEvent
    Topic->>Billing: OrcamentoGeradoEvent (fila propria)
    Billing->>MP: cria cobranca (PIX)
    MP-->>Billing: webhook: payment.updated

    rect rgb(235, 250, 240)
    Note over Billing,MP: Caminho feliz
    Billing->>MP: consulta pagamento (nunca confia so no webhook)
    MP-->>Billing: status: approved
    Billing->>Topic: PagamentoAprovadoEvent
    end

    rect rgb(255, 235, 235)
    Note over Billing,MP: Pagamento recusado
    Billing->>MP: consulta pagamento
    MP-->>Billing: status: rejected
    Billing->>Topic: PagamentoRecusadoEvent
    Billing->>Topic: CompensarOSEvent (origemFalha=PAGAMENTO)
    end

    rect rgb(255, 245, 225)
    Note over Billing,MP: Compensacao - falha de execucao
    Topic->>Billing: CompensarOSEvent (origemFalha=EXECUCAO)
    Billing->>MP: solicita reembolso
    end
```

## Saga Pattern — consome e publica

Ver [SAGA_PATTERN_SPEC.md](https://github.com/marcosrenansilvafaria-afk/oficina-app/blob/main/docs/SAGA_PATTERN_SPEC.md)
para o desenho completo.

**Consome** (fila `oficina-saga-billing-service.fifo`):

| Evento | Ação |
|---|---|
| `OrcamentoGeradoEvent` | `ReceberOrcamento`: registra o orçamento, cria o `Pagamento` (`PENDENTE`), abre a cobrança no Mercado Pago |
| `CompensarOSEvent` (`origemFalha=EXECUCAO`) | `ReembolsarPagamento`: estorna o pagamento já `APROVADO` |
| `CompensarOSEvent` (`origemFalha=PAGAMENTO`) | no-op — este serviço publicou esse evento, é um eco idempotente |

**Publica** (tópico `oficina-saga-events.fifo`):
- `PagamentoAprovadoEvent` — webhook confirma aprovação.
- `PagamentoRecusadoEvent` + `CompensarOSEvent` (`origemFalha=PAGAMENTO`) — webhook confirma recusa/expiração.

## Banco de dados (DynamoDB)

3 tabelas exclusivas (`terraform/dynamodb.tf`), `PAY_PER_REQUEST` (sem custo
ocioso): `billing-orcamentos`, `billing-pagamentos` (GSIs por
`ordemServicoId` e `mercadoPagoPaymentId`), `billing-webhook-logs`
(append-only, histórico de toda notificação recebida).

## Módulo Mercado Pago

- Porta `application/ports/mercado-pago-gateway.ts` + implementação real
  (`infraestructure/mercadopago/mercadopago-gateway.service.ts`, SDK
  oficial `mercadopago` v2) + implementação fake (usada sem
  `MERCADOPAGO_ACCESS_TOKEN` — dev local/CI, ver Pendências).
- Webhook (`POST /webhooks/mercadopago`, rota pública) valida o header
  `x-signature` (HMAC-SHA256) via `MERCADOPAGO_WEBHOOK_SECRET` e **nunca
  confia no corpo do webhook** — sempre consulta o pagamento real antes de
  decidir aprovado/recusado. Todo webhook (inclusive com assinatura
  inválida) é registrado em `WebhookLog`.

## Execução local

```bash
docker-compose up --build
```

Sobe `amazon/dynamodb-local` (porta `8000`) + cria as 3 tabelas
automaticamente (`create-tables`) + a API em `http://localhost:3002`. Sem
`MERCADOPAGO_ACCESS_TOKEN`, usa o gateway fake automaticamente.

## Swagger / OpenAPI

`http://localhost:3002/docs`.

## Testes e cobertura

```bash
npm test                  # unitarios (Jest)
npm run test:cov:critical # cobertura de domain/entities + application/use-cases, gate >= 80%
npm run test:bdd          # BDD (jest-cucumber) - pagamento aprovado + estorno
npm run test:e2e          # end-to-end (supertest)
```

BDD (`test/bdd/pagamento.feature`, 2 cenários): pagamento aprovado
(orçamento → webhook aprovado → `Pagamento` `APROVADO` +
`PagamentoAprovadoEvent` publicado) e compensação por falha de execução
(`CompensarOSEvent origemFalha=EXECUCAO` → `Pagamento` `REEMBOLSADO`).

## Deploy no EKS

Pipeline em [`.github/workflows/ci-cd-billing-service.yml`](.github/workflows/ci-cd-billing-service.yml),
mesma estrutura do `oficina-os-service`: `lint-test` → `sonarqube`
(condicional) → `docker-build-push` → `deploy` (condicional).

**Pendência**: cluster EKS destruído ao final da Fase 3 — job `deploy`
fica `skipped` até `vars.EKS_DEPLOY_ENABLED=true`.

### Infraestrutura AWS (`terraform/`)

Tabelas DynamoDB provisionadas via Terraform próprio deste repositório
(backend remoto compartilhado, key `oficina-billing/terraform.tfstate`).
A IAM Role de CI/CD (`oficina-billing-service-github-actions`) tem duas
policies anexadas: `oficina-saga-billing-service-policy` (Sprint 1, Saga) +
`oficina-billing-dynamodb-policy` (este repositório, DynamoDB).

## Variáveis de ambiente

Ver [`.env.example`](.env.example): `DYNAMODB_ENDPOINT`/`DYNAMODB_TABLE_*`,
`MERCADOPAGO_ACCESS_TOKEN`/`MERCADOPAGO_WEBHOOK_SECRET`,
`SAGA_TOPIC_ARN`/`SAGA_QUEUE_URL`, `JWT_SECRET` (**idêntico** aos demais
serviços).

## Pendências conhecidas

- **Mercado Pago**: nenhuma conta/sandbox real configurada — o módulo usa
  o gateway fake por padrão (determinístico, sem rede). O código contra o
  SDK oficial está completo e testável assim que um `MERCADOPAGO_ACCESS_TOKEN`
  de sandbox existir.
- **SonarCloud**: conta ainda não criada — mesma pendência do OS Service.
- **EKS**: cluster destruído — deploy real ainda não exercido.
