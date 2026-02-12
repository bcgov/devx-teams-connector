import { z } from 'zod';

import { ConnectorError } from '../errors';

const TargetSchema = z.object({
  teamId: z.string().uuid(),
  channelId: z.string().min(1),
});

const TextContentSchema = z.object({
  kind: z.literal('text'),
  text: z.string().min(1).max(10000),
});

const TemplateContentSchema = z.object({
  kind: z.literal('template'),
  template: z.literal('generic'),
  data: z.record(z.unknown()),
});

const ContentSchema = z.discriminatedUnion('kind', [TextContentSchema, TemplateContentSchema]);

const MetadataSchema = z.record(z.string()).optional();

export const SendMessageRequestSchema = z.object({
  target: TargetSchema,
  content: ContentSchema,
  metadata: MetadataSchema,
});

export type SendMessageRequestInput = z.infer<typeof SendMessageRequestSchema>;

export function validateSendMessageRequest(input: unknown): SendMessageRequestInput {
  const parsed = SendMessageRequestSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.join('.') || 'request';
    const message = issue ? `${path}: ${issue.message}` : 'Invalid request payload.';

    throw new ConnectorError('VALIDATION_ERROR', message, 400, false);
  }

  return parsed.data;
}
