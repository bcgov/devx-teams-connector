import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';

import { ConnectorError } from '../errors';
import { renderTemplate } from '../templates';
import type { MessageAccepted, SendMessageRequest } from '../types';
import type { BotFrameworkActivity, DeliveryAdapter, DeliveryPayload } from '../adapters/types';

export class MessageService {
  constructor(
    private readonly adapter: DeliveryAdapter,
    private readonly logger: Logger,
  ) {}

  async send(request: SendMessageRequest): Promise<MessageAccepted> {
    const payload = this.buildDeliveryPayload(request);
    const deliveryResult = await this.adapter.send(payload);

    if (!deliveryResult.success) {
      throw new ConnectorError(
        deliveryResult.errorCode ?? 'DELIVERY_FAILED',
        deliveryResult.error ?? 'Failed to deliver message to Teams.',
        deliveryResult.httpStatus ?? 500,
        deliveryResult.retryable ?? false,
        deliveryResult.headers,
      );
    }

    const accepted: MessageAccepted = {
      id: deliveryResult.teamsMessageId ?? randomUUID(),
      status: 'delivered',
      timestamp: new Date().toISOString(),
    };

    this.logger.info(
      {
        teamId: request.target.teamId,
        channelId: request.target.channelId,
        contentKind: request.content.kind,
        template: request.content.kind === 'template' ? request.content.template : undefined,
        metadataKeys: request.metadata ? Object.keys(request.metadata) : undefined,
        status: accepted.status,
      },
      'Message delivered',
    );

    return accepted;
  }

  preview(request: SendMessageRequest): DeliveryPayload {
    const payload = this.buildDeliveryPayload(request);

    this.logger.info(
      {
        teamId: payload.teamId,
        channelId: payload.channelId,
        contentKind: request.content.kind,
        template: request.content.kind === 'template' ? request.content.template : undefined,
        metadataKeys: request.metadata ? Object.keys(request.metadata) : undefined,
        mode: 'preview',
      },
      'Preview payload generated',
    );

    return payload;
  }

  private buildDeliveryPayload(request: SendMessageRequest): DeliveryPayload {
    return {
      channelId: request.target.channelId,
      teamId: request.target.teamId,
      activity: this.buildActivity(request),
    };
  }

  private buildActivity(request: SendMessageRequest): BotFrameworkActivity {
    if (request.content.kind === 'text') {
      return {
        type: 'message',
        text: request.content.text,
        textFormat: 'plain',
      };
    }

    const card = renderTemplate(request.content.template, request.content.data);

    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: card,
        },
      ],
    };
  }
}
