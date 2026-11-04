import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { resetInMemoryRepositories } from '../src/infraestructure/singletons';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    await resetInMemoryRepositories();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('/metrics (GET)', () => {
    return request(app.getHttpServer()).get('/metrics').expect(200);
  });

  it('/pagamentos/:ordemServicoId (GET) sem token deve retornar 401', () => {
    return request(app.getHttpServer()).get('/pagamentos/os-1').expect(401);
  });
});
