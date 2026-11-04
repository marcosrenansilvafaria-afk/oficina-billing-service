import { WebhookLog } from '../entities/webhook-log';

export interface IWebhookLogRepository {
  save(log: WebhookLog): Promise<void>;
  clear(): Promise<void>;
}
