import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';

import { ConnectorError } from '../errors';
import { renderGenericTemplate } from '../templates/generic';
import type { MessageAccepted, SendMessageRequest } from '../types';
import type { BotFrameworkActivity, DeliveryAdapter } from '../adapters/types';

export class MessageService {
  constructor(
    private readonly adapter: DeliveryAdapter,
    private readonly logger: Logger,
  ) {}

  async send(request: SendMessageRequest, userEntraId: string): Promise<MessageAccepted> {
    const activity = this.buildActivity(request);

    const deliveryResult = await this.adapter.send({
      channelId: request.target.channelId,
      teamId: request.target.teamId,
      activity,
    });

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
      id: randomUUID(),
      status: 'accepted',
      timestamp: new Date().toISOString(),
    };

    this.logger.info(
      {
        userEntraId,
        teamId: request.target.teamId,
        channelId: request.target.channelId,
        contentKind: request.content.kind,
        template: request.content.kind === 'template' ? request.content.template : undefined,
        metadata: request.metadata,
        status: accepted.status,
      },
      'Message accepted for delivery',
    );

    return accepted;
  }

  private buildActivity(request: SendMessageRequest): BotFrameworkActivity {
    if (request.content.kind === 'text') {
      return {
        type: 'message',
        text: request.content.text,
        textFormat: 'xml',
      };
    }

    if (request.content.kind === 'template' && request.content.template === 'generic') {
      const card = renderGenericTemplate(request.content.data);

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

    throw new ConnectorError('VALIDATION_ERROR', 'Unsupported content kind for this PoC.', 400, false);
  }
}
