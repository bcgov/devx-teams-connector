import type { ErrorCode } from '../errors';
import type { MentionEntity } from '../types';

export interface BotFrameworkActivity {
  type: 'message';
  text?: string;
  textFormat?: 'plain' | 'xml';
  entities?: MentionEntity[];
  attachments?: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    content: object;
  }>;
}

export interface DeliveryPayload {
  channelId: string;
  teamId: string;
  activity: BotFrameworkActivity;
}

export interface DeliveryResult {
  success: boolean;
  teamsMessageId?: string;
  error?: string;
  retryable?: boolean;
  errorCode?: ErrorCode;
  httpStatus?: number;
  headers?: Record<string, string>;
}

export interface DeliveryAdapter {
  send(payload: DeliveryPayload): Promise<DeliveryResult>;
}
