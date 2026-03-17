import { describe, expect, it, vi } from 'vitest';

import { BotFrameworkAdapter } from '../../src/adapters/botFramework';

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

describe('BotFrameworkAdapter', () => {
  const basePayload = {
    teamId: '00000000-0000-0000-0000-000000000000',
    channelId: '19:abc@thread.tacv2',
    activity: {
      type: 'message' as const,
      text: 'hello',
      textFormat: 'xml' as const,
    },
  };

  it('caches token between sends', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ id: 'one' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'two' }));

    const adapter = new BotFrameworkAdapter(
      {
        botId: 'bot-id',
        botSecret: 'bot-secret',
        serviceUrl: 'https://smba.trafficmanager.net/teams',
        tokenTenant: 'botframework.com',
      },
      fetchMock,
    );

    await adapter.send(basePayload);
    await adapter.send(basePayload);

    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/oauth2/v2.0/token'),
    ).length;

    expect(tokenCalls).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('maps 429 responses to RATE_LIMITED', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token', expires_in: 3600 }))
      .mockResolvedValueOnce(
        jsonResponse({ message: 'throttled' }, 429, {
          'Retry-After': '7',
        }),
      );

    const adapter = new BotFrameworkAdapter(
      {
        botId: 'bot-id',
        botSecret: 'bot-secret',
        serviceUrl: 'https://smba.trafficmanager.net/teams',
        tokenTenant: 'botframework.com',
      },
      fetchMock,
    );

    const result = await adapter.send(basePayload);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('RATE_LIMITED');
    expect(result.retryable).toBe(true);
    expect(result.httpStatus).toBe(429);
    expect(result.headers).toEqual({ 'Retry-After': '7' });
  });

  it('maps 5xx responses to BACKEND_UNAVAILABLE', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'downstream failed' }, 503));

    const adapter = new BotFrameworkAdapter(
      {
        botId: 'bot-id',
        botSecret: 'bot-secret',
        serviceUrl: 'https://smba.trafficmanager.net/teams',
        tokenTenant: 'botframework.com',
      },
      fetchMock,
    );

    const result = await adapter.send(basePayload);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('BACKEND_UNAVAILABLE');
    expect(result.retryable).toBe(true);
    expect(result.httpStatus).toBe(502);
  });

  it('maps other non-2xx responses to DELIVERY_FAILED', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'bad request' }, 400));

    const adapter = new BotFrameworkAdapter(
      {
        botId: 'bot-id',
        botSecret: 'bot-secret',
        serviceUrl: 'https://smba.trafficmanager.net/teams',
        tokenTenant: 'botframework.com',
      },
      fetchMock,
    );

    const result = await adapter.send(basePayload);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('DELIVERY_FAILED');
    expect(result.retryable).toBe(false);
    expect(result.httpStatus).toBe(400);
  });

  it('healthCheck always returns true', async () => {
    const adapter = new BotFrameworkAdapter(
      {
        botId: 'bot-id',
        botSecret: 'bot-secret',
        serviceUrl: 'https://smba.trafficmanager.net/teams',
        tokenTenant: 'botframework.com',
      },
      vi.fn(),
    );

    expect(await adapter.healthCheck()).toBe(true);
  });

  it('uses configured token tenant for oauth endpoint', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ id: 'one' }));

    const adapter = new BotFrameworkAdapter(
      {
        botId: 'bot-id',
        botSecret: 'bot-secret',
        serviceUrl: 'https://smba.trafficmanager.net/teams',
        tokenTenant: '12345678-1234-1234-1234-123456789abc',
      },
      fetchMock,
    );

    await adapter.send(basePayload);

    const tokenUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(tokenUrl).toContain('/12345678-1234-1234-1234-123456789abc/oauth2/v2.0/token');
  });
});
