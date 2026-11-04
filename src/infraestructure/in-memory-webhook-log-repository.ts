import { WebhookLog } from '../domain/entities/webhook-log';
import { IWebhookLogRepository } from '../domain/repositories/webhook-log-repository.interface';

export class InMemoryWebhookLogRepository implements IWebhookLogRepository {
  private items: WebhookLog[] = [];

  save(log: WebhookLog): Promise<void> {
    this.items.push(log);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.items = [];
    return Promise.resolve();
  }
}
