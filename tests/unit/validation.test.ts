import { describe, expect, it } from 'vitest';

import { ConnectorError } from '../../src/errors';
import { validateSendMessageRequest } from '../../src/validation/schemas';

const target = {
  teamId: '00000000-0000-0000-0000-000000000000',
  channelId: '19:abc@thread.tacv2',
};

describe('validateSendMessageRequest', () => {
  it('accepts valid text payload', () => {
    const payload = {
      target,
      content: {
        kind: 'text',
        text: 'hello',
      },
    };

    const result = validateSendMessageRequest(payload);
    expect(result.content.kind).toBe('text');
  });

  it('accepts valid template payloads for all supported templates', () => {
    const payloads = [
      {
        target,
        content: {
          kind: 'template',
          template: 'generic',
          data: {
            title: 'Maintenance',
            severity: 'error',
          },
        },
      },
      {
        target,
        content: {
          kind: 'template',
          template: 'github_pull_request',
          data: {
            event: 'opened',
            title: 'PR #123',
            repo: 'org/repo',
            author: 'octocat',
            url: 'https://github.com/org/repo/pull/123',
          },
        },
      },
      {
        target,
        content: {
          kind: 'template',
          template: 'github_workflow_run',
          data: {
            event: 'completed',
            conclusion: 'success',
            workflow: 'CI/CD Pipeline',
            repo: 'org/repo',
            branch: 'main',
            author: 'octocat',
            url: 'https://github.com/org/repo/actions/runs/123',
          },
        },
      },
      {
        target,
        content: {
          kind: 'template',
          template: 'sysdig',
          data: {
            severity: 1,
            alertName: 'CPU saturation',
            subject: 'CPU saturation on prod-cluster is Triggered',
            state: 'ACTIVE',
            timestamp: '2026-02-22T12:00:00Z',
          },
        },
      },
      {
        target,
        content: {
          kind: 'template',
          template: 'uptime',
          data: {
            status: 'down',
            service: 'payments-api',
          },
        },
      },
      {
        target,
        content: {
          kind: 'template',
          template: 'db_backup',
          data: {
            status: 'info',
            projectName: 'abc123',
            projectFriendlyName: 'My Project',
          },
        },
      },
      {
        target,
        content: {
          kind: 'template',
          template: 'argocd',
          data: {
            event: 'sync_succeeded',
            application: 'platform-registry-prod',
            syncStatus: 'Synced',
            healthStatus: 'Healthy',
            revision: 'a1b2c3d',
            timestamp: '2026-02-22T12:00:00Z',
          },
        },
      },
    ] as const;

    for (const payload of payloads) {
      expect(validateSendMessageRequest(payload)).toBeDefined();
    }
  });

  it('rejects unsupported template names', () => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'unknown',
        data: {
          title: 'x',
        },
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
  });

  it('rejects missing required template fields', () => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'github_pull_request',
        data: {
          title: 'PR #123',
          // missing: event, repo, author, url
        },
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
  });

  it('rejects invalid enum values', () => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'sysdig',
        data: {
          severity: 99,
          alertName: 'CPU saturation',
        },
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
  });

  it.each([
    ['active', 'ACTIVE'],
    ['ok', 'OK'],
  ] as const)('accepts and normalizes legacy Sysdig state %s', (state, expected) => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'sysdig',
        data: {
          severity: 1,
          alertName: 'CPU saturation',
          state,
        },
      },
    };

    const result = validateSendMessageRequest(payload);

    expect(result.content.kind).toBe('template');
    if (result.content.kind !== 'template' || result.content.template !== 'sysdig') {
      throw new Error('Expected Sysdig template content');
    }
    expect(result.content.data.state).toBe(expected);
  });

  it('accepts unknown fields and strips them from output', () => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'uptime',
        data: {
          status: 'up',
          service: 'payments-api',
          extra: 'should-be-stripped',
        },
      },
    };

    const result = validateSendMessageRequest(payload);
    expect((result.content as Record<string, unknown>).extra).toBeUndefined();
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

  it('accepts valid mentions', () => {
    const payload = {
      target,
      mentions: [
        {
          id: '87d349ed-44d7-43e1-9a83-5f2406dee5bd',
          name: 'Adele Vance',
        },
      ],
      content: {
        kind: 'text',
        text: 'please review',
      },
    };

    const result = validateSendMessageRequest(payload);
    expect(result.mentions).toEqual(payload.mentions);
  });

  it('treats an empty mentions array as no mentions', () => {
    const payload = {
      target,
      mentions: [],
      content: {
        kind: 'text',
        text: 'hello',
      },
    };

    const result = validateSendMessageRequest(payload);
    expect(result.mentions).toEqual([]);
  });

  it('rejects more than 10 mentions', () => {
    const payload = {
      target,
      mentions: Array.from({ length: 11 }, (_, index) => ({
        id: `user-${index}`,
        name: `User ${index}`,
      })),
      content: {
        kind: 'text',
        text: 'hello',
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
  });
});

describe('validateSendMessageRequest normalization', () => {
  it('truncates oversized text instead of rejecting it', () => {
    const payload = {
      target,
      content: {
        kind: 'text',
        text: 'a'.repeat(10050),
      },
    };

    const result = validateSendMessageRequest(payload);
    const text = result.content.kind === 'text' ? result.content.text : '';
    expect(text).toHaveLength(10000);
    expect(text.endsWith('\u2026')).toBe(true);
  });

  it('rejects oversized html instead of truncating it', () => {
    const payload = {
      target,
      content: {
        kind: 'html',
        text: `<p>${'a'.repeat(10050)}</p>`,
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
  });

  it('truncates oversized template fields instead of rejecting them', () => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'generic',
        data: {
          title: 'T'.repeat(250),
          body: 'B'.repeat(2100),
        },
      },
    };

    const result = validateSendMessageRequest(payload);
    const data = result.content.kind === 'template' && result.content.template === 'generic'
      ? result.content.data
      : null;
    expect(data?.title).toHaveLength(200);
    expect(data?.body).toHaveLength(2000);
  });

  it('treats blank optional template fields as unset', () => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'statuscake',
        data: {
          status: 'down',
          testName: 'API health',
          websiteUrl: '',
          statusCode: '',
          ip: '   ',
          tags: '',
        },
      },
    };

    const result = validateSendMessageRequest(payload);
    const data = result.content.kind === 'template' && result.content.template === 'statuscake'
      ? result.content.data
      : null;
    expect(data?.websiteUrl).toBeUndefined();
    expect(data?.statusCode).toBeUndefined();
    expect(data?.ip).toBeUndefined();
    expect(data?.tags).toBeUndefined();
  });

  it('treats blank optional timestamps and enums as unset', () => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'argocd',
        data: {
          event: 'sync_failed',
          application: 'checkout-api',
          syncStatus: '',
          timestamp: '',
          message: '',
          url: '',
        },
      },
    };

    const result = validateSendMessageRequest(payload);
    const data = result.content.kind === 'template' && result.content.template === 'argocd'
      ? result.content.data
      : null;
    expect(data?.syncStatus).toBeUndefined();
    expect(data?.timestamp).toBeUndefined();
    expect(data?.message).toBeUndefined();
    expect(data?.url).toBeUndefined();
  });

  it('still rejects blank required fields', () => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'statuscake',
        data: {
          status: 'down',
          testName: '',
        },
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
  });
});

describe('validateSendMessageRequest — card pass-through', () => {
  const minimalCard = {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [{ type: 'TextBlock', text: 'hello' }],
  };

  function cardPayload(card: unknown) {
    return { target, content: { kind: 'card', card } };
  }

  function codeOf(fn: () => unknown): string {
    try {
      fn();
    } catch (error) {
      if (error instanceof ConnectorError) {
        return error.code;
      }
      throw error;
    }
    throw new Error('expected validateSendMessageRequest to throw');
  }

  it('rejects card pass-through when the flag is disabled', () => {
    expect(codeOf(() => validateSendMessageRequest(cardPayload(minimalCard)))).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('accepts a valid card when the flag is enabled', () => {
    const result = validateSendMessageRequest(cardPayload(minimalCard), {
      allowCardPassthrough: true,
    });

    expect(result.content.kind).toBe('card');
  });

  it('preserves unknown/Teams-specific card properties (passthrough)', () => {
    const result = validateSendMessageRequest(
      cardPayload({ ...minimalCard, msteams: { width: 'Full' }, speak: 'hi' }),
      { allowCardPassthrough: true },
    );

    const card = (result.content as { card: Record<string, unknown> }).card;
    expect(card.msteams).toEqual({ width: 'Full' });
    expect(card.speak).toBe('hi');
  });

  it('accepts a bare { type: "AdaptiveCard" } (type-only floor)', () => {
    const result = validateSendMessageRequest(cardPayload({ type: 'AdaptiveCard' }), {
      allowCardPassthrough: true,
    });

    expect(result.content.kind).toBe('card');
  });

  it('rejects a card with the wrong/missing type literal', () => {
    expect(
      codeOf(() =>
        validateSendMessageRequest(cardPayload({ ...minimalCard, type: 'Nope' }), {
          allowCardPassthrough: true,
        }),
      ),
    ).toBe('VALIDATION_ERROR');

    expect(
      codeOf(() =>
        validateSendMessageRequest(cardPayload({ body: [] }), {
          allowCardPassthrough: true,
        }),
      ),
    ).toBe('VALIDATION_ERROR');
  });
});
