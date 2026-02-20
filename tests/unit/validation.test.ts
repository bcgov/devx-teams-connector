import { describe, expect, it } from 'vitest';

import { ConnectorError } from '../../src/errors';
import { validateSendMessageRequest } from '../../src/validation/schemas';

describe('validateSendMessageRequest', () => {
  it('accepts valid text payload', () => {
    const payload = {
      target: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:abc@thread.tacv2',
      },
      content: {
        kind: 'text',
        text: 'hello',
      },
    };

    const result = validateSendMessageRequest(payload);
    expect(result.content.kind).toBe('text');
  });

  it('accepts valid generic template payload', () => {
    const payload = {
      target: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:abc@thread.tacv2',
      },
      content: {
        kind: 'template',
        template: 'generic',
        data: {
          title: 'Maintenance',
        },
      },
    };

    const result = validateSendMessageRequest(payload);
    expect(result.content.kind).toBe('template');
  });

  it('rejects malformed target', () => {
    const payload = {
      target: {
        teamId: 'not-a-uuid',
        channelId: '19:abc@thread.tacv2',
      },
      content: {
        kind: 'text',
        text: 'hello',
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
  });

  it('rejects unsupported content kinds', () => {
    const payload = {
      target: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:abc@thread.tacv2',
      },
      content: {
        kind: 'adaptive_card',
        card: { type: 'AdaptiveCard' },
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
  });
});
