import pino from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app';
import type { DeliveryAdapter } from '../../src/adapters/types';
import type { Config } from '../../src/config';
import type { TemplateName } from '../../src/types';
import { invokeApp } from './httpHarness';

const target = {
  teamId: '00000000-0000-0000-0000-000000000000',
  channelId: '19:abc@thread.tacv2',
};

const authHeaders = {
  authorization: 'Bearer test-api-key',
  'x-user-entra-id': '11111111-1111-1111-1111-111111111111',
};

describe('messages endpoint', () => {
  const config: Config = {
    port: 3000,
    apiKey: 'test-api-key',
    botId: 'bot-id',
    botSecret: 'bot-secret',
    botServiceUrl: 'https://smba.trafficmanager.net/teams',
    tokenTenant: 'botframework.com',
    logLevel: 'silent',
    version: '1.0.0',
  };

  let adapter: DeliveryAdapter;

  beforeEach(() => {
    adapter = {
      send: vi.fn().mockResolvedValue({ success: true, teamsMessageId: 'abc' }),
      healthCheck: vi.fn().mockResolvedValue(true),
    };
  });

  function createTestApp() {
    return createApp({
      config,
      adapter,
      logger: pino({ enabled: false }),
      enableHttpLogging: false,
    });
  }

  it('returns 202 for valid text requests', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: authHeaders,
      body: {
        target,
        content: {
          kind: 'text',
          text: 'hello',
        },
      },
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(202);
    expect(body.status).toBe('accepted');
    expect(typeof body.id).toBe('string');
    expect(typeof body.timestamp).toBe('string');
  });

  it('returns preview payload without posting to adapter for text requests', async () => {
    const sendMock = vi.fn().mockResolvedValue({ success: true, teamsMessageId: 'abc' });
    adapter.send = sendMock;
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages/preview',
      headers: authHeaders,
      body: {
        target,
        content: {
          kind: 'text',
          text: 'hello from preview',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();

    const body = response.body as Record<string, unknown>;
    expect(body.mode).toBe('preview');

    const payload = body.payload as Record<string, unknown>;
    expect(payload.teamId).toBe(target.teamId);
    expect(payload.channelId).toBe(target.channelId);
    expect(payload.activity).toEqual({
      type: 'message',
      text: 'hello from preview',
      textFormat: 'xml',
    });
  });

  it('returns preview adaptive-card activity for template requests', async () => {
    const sendMock = vi.fn().mockResolvedValue({ success: true, teamsMessageId: 'abc' });
    adapter.send = sendMock;
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages/preview',
      headers: authHeaders,
      body: {
        target,
        content: {
          kind: 'template',
          template: 'sysdig',
          data: {
            severity: 'high',
            alertName: 'CPU saturation',
          },
        },
      },
    });

    expect(response.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();

    const body = response.body as Record<string, unknown>;
    const payload = body.payload as Record<string, unknown>;
    const activity = payload.activity as Record<string, unknown>;

    expect(activity.text).toBeUndefined();
    expect(activity.textFormat).toBeUndefined();
    expect(Array.isArray(activity.attachments)).toBe(true);
    expect((activity.attachments as Array<unknown>).length).toBe(1);
  });

  it('rejects missing api key', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        'x-user-entra-id': authHeaders['x-user-entra-id'],
      },
      body: {},
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_FAILED');
  });

  it('rejects invalid api key', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        authorization: 'Bearer wrong-key',
        'x-user-entra-id': authHeaders['x-user-entra-id'],
      },
      body: {},
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_FAILED');
  });

  it('rejects missing user id header', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        authorization: authHeaders.authorization,
      },
      body: {},
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_FAILED');
  });

  it('rejects missing api key for preview', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages/preview',
      headers: {
        'x-user-entra-id': authHeaders['x-user-entra-id'],
      },
      body: {},
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_FAILED');
  });

  it('rejects invalid api key for preview', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages/preview',
      headers: {
        authorization: 'Bearer wrong-key',
        'x-user-entra-id': authHeaders['x-user-entra-id'],
      },
      body: {},
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_FAILED');
  });

  it('rejects missing user id header for preview', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages/preview',
      headers: {
        authorization: authHeaders.authorization,
      },
      body: {},
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_FAILED');
  });

  it('rejects invalid payload shape', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: authHeaders,
      body: {
        target: {
          teamId: target.teamId,
        },
        content: {
          kind: 'text',
          text: 'hello',
        },
      },
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns retryable backend errors from adapter', async () => {
    adapter.send = vi.fn().mockResolvedValue({
      success: false,
      error: 'temporarily unavailable',
      retryable: true,
      errorCode: 'BACKEND_UNAVAILABLE',
      httpStatus: 502,
    });

    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: authHeaders,
      body: {
        target,
        content: {
          kind: 'text',
          text: 'hello',
        },
      },
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(502);
    expect(body.code).toBe('BACKEND_UNAVAILABLE');
    expect(body.retryable).toBe(true);
  });

  it('returns 400 for invalid template data instead of 500', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: authHeaders,
      body: {
        target,
        content: {
          kind: 'template',
          template: 'sysdig',
          data: {
            severity: 'high',
            alertName: 'CPU saturation',
            unexpected: 'extra',
          },
        },
      },
    });

    expect(response.status).toBe(400);
    const body = response.body as Record<string, unknown>;
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid preview template data', async () => {
    const app = createTestApp();

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages/preview',
      headers: authHeaders,
      body: {
        target,
        content: {
          kind: 'template',
          template: 'sysdig',
          data: {
            severity: 'high',
            alertName: 'CPU saturation',
            unexpected: 'extra',
          },
        },
      },
    });

    expect(response.status).toBe(400);
    const body = response.body as Record<string, unknown>;
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('sends each supported template as attachment-only activity', async () => {
    const sendMock = vi.fn().mockResolvedValue({ success: true, teamsMessageId: 'abc' });
    adapter.send = sendMock;

    const app = createTestApp();

    const templatePayloads: Array<{ template: TemplateName; data: Record<string, unknown> }> = [
      {
        template: 'generic',
        data: {
          title: 'Maintenance Window',
          body: 'DB maintenance in 30 minutes.',
          severity: 'warning',
        },
      },
      {
        template: 'github',
        data: {
          event: 'opened',
          title: 'PR #123',
          repo: 'org/repo',
          author: 'octocat',
          url: 'https://github.com/org/repo/pull/123',
        },
      },
      {
        template: 'sysdig',
        data: {
          severity: 'high',
          alertName: 'CPU saturation',
          timestamp: '2026-02-22T12:00:00Z',
        },
      },
      {
        template: 'uptime',
        data: {
          status: 'degraded',
          service: 'payments-api',
          responseTimeMs: 640,
        },
      },
      {
        template: 'db_backup',
        data: {
          status: 'success',
          database: 'users',
          duration: '2m 03s',
          size: '1.2 GB',
          container: 'backup-job-1',
        },
      },
      {
        template: 'argocd',
        data: {
          event: 'sync_failed',
          application: 'platform-registry-prod',
          syncStatus: 'OutOfSync',
          healthStatus: 'Degraded',
          revision: 'f4e5d6c',
          message: 'ComparisonError: exceeded timeout waiting for condition',
          url: 'https://argocd.example.com/applications/platform-registry-prod',
        },
      },
    ];

    for (const payload of templatePayloads) {
      const response = await invokeApp(app, {
        method: 'POST',
        path: '/api/v1/messages',
        headers: authHeaders,
        body: {
          target,
          content: {
            kind: 'template',
            template: payload.template,
            data: payload.data,
          },
        },
      });

      expect(response.status).toBe(202);
    }

    expect(sendMock).toHaveBeenCalledTimes(templatePayloads.length);

    for (const call of sendMock.mock.calls) {
      const args = call[0] as Record<string, unknown>;
      const activity = args.activity as Record<string, unknown>;

      expect(activity.text).toBeUndefined();
      expect(activity.textFormat).toBeUndefined();
      expect(Array.isArray(activity.attachments)).toBe(true);
      expect((activity.attachments as Array<unknown>).length).toBe(1);
    }
  });
});
