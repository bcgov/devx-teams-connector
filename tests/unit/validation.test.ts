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
            severity: 'warning',
          },
        },
      },
      {
        target,
        content: {
          kind: 'template',
          template: 'github',
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
          template: 'sysdig',
          data: {
            severity: 'high',
            alertName: 'CPU saturation',
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
            status: 'degraded',
            service: 'payments-api',
            responseTimeMs: 640,
          },
        },
      },
      {
        target,
        content: {
          kind: 'template',
          template: 'db_backup',
          data: {
            status: 'success',
            database: 'users',
            duration: '2m 03s',
            container: 'backup-job-1',
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
        template: 'github',
        data: {
          title: 'PR #123',
          repo: 'org/repo',
          author: 'octocat',
          url: 'https://github.com/org/repo/pull/123',
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
          severity: 'emergency',
          alertName: 'CPU saturation',
        },
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
  });

  it('rejects unknown fields due to strict schema enforcement', () => {
    const payload = {
      target,
      content: {
        kind: 'template',
        template: 'uptime',
        data: {
          status: 'up',
          service: 'payments-api',
          extra: 'should-not-pass',
        },
      },
    };

    expect(() => validateSendMessageRequest(payload)).toThrow(ConnectorError);
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
});
