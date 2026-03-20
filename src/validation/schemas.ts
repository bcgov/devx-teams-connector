import { z } from 'zod';

import { ConnectorError } from '../errors';
import { templateDataSchemas } from '../templates';
import type { SendMessageRequest } from '../types';

const TargetSchema = z.object({
  teamId: z.string().uuid(),
  channelId: z.string().min(1),
});

const TextContentSchema = z.object({
  kind: z.literal('text'),
  text: z.string().min(1).max(10000),
});

const HtmlContentSchema = z.object({
  kind: z.literal('html'),
  text: z.string().min(1).max(10000),
});

const GenericTemplateContentSchema = z.object({
  kind: z.literal('template'),
  template: z.literal('generic'),
  data: templateDataSchemas.generic,
});

const GitHubPrTemplateContentSchema = z.object({
  kind: z.literal('template'),
  template: z.literal('github_pull_request'),
  data: templateDataSchemas['github_pull_request'],
});

const GitHubWorkTemplateContentSchema = z.object({
  kind: z.literal('template'),
  template: z.literal('github_workflow_run'),
  data: templateDataSchemas['github_workflow_run'],
});

const SysdigTemplateContentSchema = z.object({
  kind: z.literal('template'),
  template: z.literal('sysdig'),
  data: templateDataSchemas.sysdig,
});

const UptimeTemplateContentSchema = z.object({
  kind: z.literal('template'),
  template: z.literal('uptime'),
  data: templateDataSchemas.uptime,
});

const DbBackupTemplateContentSchema = z.object({
  kind: z.literal('template'),
  template: z.literal('db_backup'),
  data: templateDataSchemas.db_backup,
});

const ArgoCdTemplateContentSchema = z.object({
  kind: z.literal('template'),
  template: z.literal('argocd'),
  data: templateDataSchemas.argocd,
});

const TemplateContentSchema = z.discriminatedUnion('template', [
  GenericTemplateContentSchema,
  GitHubPrTemplateContentSchema,
  GitHubWorkTemplateContentSchema,
  SysdigTemplateContentSchema,
  UptimeTemplateContentSchema,
  DbBackupTemplateContentSchema,
  ArgoCdTemplateContentSchema,
]);

const ContentSchema = z.union([TextContentSchema, HtmlContentSchema, TemplateContentSchema]);

const MetadataSchema = z.record(z.string().min(1).max(64), z.string().max(256))
  .refine((obj) => Object.keys(obj).length <= 20, { message: 'metadata: too many keys (max 20)' })
  .optional();

export const SendMessageRequestSchema: z.ZodType<SendMessageRequest> = z.object({
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
