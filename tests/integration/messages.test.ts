import pino from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app';
import type { Config } from '../../src/config';
import type { DeliveryAdapter } from '../../src/adapters/types';
import { invokeApp } from './httpHarness';

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

  it('returns 202 for valid message requests', async () => {
    const app = createApp({
      config,
      adapter,
      logger: pino({ enabled: false }),
      enableHttpLogging: false,
    });

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        authorization: 'Bearer test-api-key',
        'x-user-entra-id': '11111111-1111-1111-1111-111111111111',
      },
      body: {
        target: {
          teamId: '00000000-0000-0000-0000-000000000000',
          channelId: '19:abc@thread.tacv2',
        },
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

  it('rejects missing api key', async () => {
    const app = createApp({
      config,
      adapter,
      logger: pino({ enabled: false }),
      enableHttpLogging: false,
    });

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        'x-user-entra-id': '11111111-1111-1111-1111-111111111111',
      },
      body: {},
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_FAILED');
  });

  it('rejects invalid api key', async () => {
    const app = createApp({
      config,
      adapter,
      logger: pino({ enabled: false }),
      enableHttpLogging: false,
    });

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        authorization: 'Bearer wrong-key',
        'x-user-entra-id': '11111111-1111-1111-1111-111111111111',
      },
      body: {},
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_FAILED');
  });

  it('rejects missing user id header', async () => {
    const app = createApp({
      config,
      adapter,
      logger: pino({ enabled: false }),
      enableHttpLogging: false,
    });

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        authorization: 'Bearer test-api-key',
      },
      body: {},
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_FAILED');
  });

  it('rejects invalid payload shape', async () => {
    const app = createApp({
      config,
      adapter,
      logger: pino({ enabled: false }),
      enableHttpLogging: false,
    });

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        authorization: 'Bearer test-api-key',
        'x-user-entra-id': '11111111-1111-1111-1111-111111111111',
      },
      body: {
        target: {
          teamId: '00000000-0000-0000-0000-000000000000',
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

    const app = createApp({
      config,
      adapter,
      logger: pino({ enabled: false }),
      enableHttpLogging: false,
    });

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        authorization: 'Bearer test-api-key',
        'x-user-entra-id': '11111111-1111-1111-1111-111111111111',
      },
      body: {
        target: {
          teamId: '00000000-0000-0000-0000-000000000000',
          channelId: '19:abc@thread.tacv2',
        },
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

  it('sends generic template as attachment-only activity', async () => {
    const sendMock = vi.fn().mockResolvedValue({ success: true, teamsMessageId: 'abc' });
    adapter.send = sendMock;

    const app = createApp({
      config,
      adapter,
      logger: pino({ enabled: false }),
      enableHttpLogging: false,
    });

    const response = await invokeApp(app, {
      method: 'POST',
      path: '/api/v1/messages',
      headers: {
        authorization: 'Bearer test-api-key',
        'x-user-entra-id': '11111111-1111-1111-1111-111111111111',
      },
      body: {
        target: {
          teamId: '00000000-0000-0000-0000-000000000000',
          channelId: '19:abc@thread.tacv2',
        },
        content: {
          kind: 'template',
          template: 'generic',
          data: {
            title: 'Maintenance Window',
            body: 'DB maintenance in 30 minutes.',
            severity: 'warning',
          },
        },
      },
    });

    expect(response.status).toBe(202);
    expect(sendMock).toHaveBeenCalledTimes(1);

    const call = sendMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const activity = call.activity as Record<string, unknown>;
    expect(activity.text).toBeUndefined();
    expect(activity.textFormat).toBeUndefined();
    expect(Array.isArray(activity.attachments)).toBe(true);
    expect((activity.attachments as Array<unknown>).length).toBe(1);
  });
});
