import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  resetInMemoryRepositories,
  orcamentoRepo,
  pagamentoRepo,
  mercadoPagoGateway,
} from '../src/infraestructure/singletons';
import { ReceberOrcamento } from '../src/application/use-cases/receber-orcamento';
import { FakeMercadoPagoGateway } from '../src/infraestructure/mercadopago/fake-mercadopago-gateway';

describe('Fluxo de pagamento (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    await resetInMemoryRepositories();
    (mercadoPagoGateway as FakeMercadoPagoGateway).definirProximoStatus(
      'approved',
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('webhook aprova o pagamento e a consulta autenticada reflete o novo status', async () => {
    const pagamento = await new ReceberOrcamento(
      orcamentoRepo,
      pagamentoRepo,
      mercadoPagoGateway,
    ).execute({ ordemServicoId: 'os-1', valorTotal: 150, itens: [] });

    await request(app.getHttpServer())
      .post('/webhooks/mercadopago')
      .send({
        type: 'payment',
        data: { id: pagamento.getMercadoPagoPaymentId() },
      })
      .expect(200);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'atendente@oficina.com', senha: 'atendente123' })
      .expect(201);

    const token = (loginResponse.body as { access_token: string }).access_token;

    const consulta = await request(app.getHttpServer())
      .get('/pagamentos/os-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((consulta.body as { status: string }).status).toBe('APROVADO');
  });
});
