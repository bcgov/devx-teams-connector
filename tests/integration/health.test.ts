import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app';
import type { Config } from '../../src/config';
import type { DeliveryAdapter } from '../../src/adapters/types';
import { invokeApp } from './httpHarness';

describe('health endpoint', () => {
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

  it('returns healthy status with version and uptime', async () => {
    const adapter: DeliveryAdapter = {
      send: vi.fn().mockResolvedValue({ success: true }),
    };

    const app = createApp({
      config,
      adapter,
      logger: pino({ enabled: false }),
      enableHttpLogging: false,
    });

    const response = await invokeApp(app, {
      method: 'GET',
      path: '/health',
    });

    const body = response.body as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.version).toBe('1.0.0');
    expect(typeof body.uptime).toBe('number');
  });
});
