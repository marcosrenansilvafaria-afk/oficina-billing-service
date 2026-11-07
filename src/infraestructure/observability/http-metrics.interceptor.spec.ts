import { of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { httpRequestDuracaoSegundos } from './metrics-registry';

describe('HttpMetricsInterceptor', () => {
  it('observa a duracao da requisicao com method/route/status_code corretos', (done) => {
    const observeSpy = jest.spyOn(httpRequestDuracaoSegundos, 'observe');
    const interceptor = new HttpMetricsInterceptor();

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          route: { path: '/pagamentos/:ordemServicoId' },
          url: '/pagamentos/os-1',
        }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe(() => {
      expect(observeSpy).toHaveBeenCalledWith(
        {
          method: 'GET',
          route: '/pagamentos/:ordemServicoId',
          status_code: '200',
        },
        expect.any(Number),
      );
      done();
    });
  });

  it('usa request.url como fallback quando a rota nao tem path definido', (done) => {
    const observeSpy = jest.spyOn(httpRequestDuracaoSegundos, 'observe');
    const interceptor = new HttpMetricsInterceptor();

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', url: '/sem-rota' }),
        getResponse: () => ({ statusCode: 404 }),
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe(() => {
      expect(observeSpy).toHaveBeenCalledWith(
        { method: 'POST', route: '/sem-rota', status_code: '404' },
        expect.any(Number),
      );
      done();
    });
  });
});
