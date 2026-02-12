import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('loads required values and defaults', () => {
    const config = loadConfig({
      PORT: '3000',
      CONNECTOR_API_KEY: 'key',
      BOT_ID: 'bot-id',
      BOT_SECRET: 'bot-secret',
    });

    expect(config.port).toBe(3000);
    expect(config.apiKey).toBe('key');
    expect(config.botServiceUrl).toBe('https://smba.trafficmanager.net/teams');
    expect(config.tokenTenant).toBe('botframework.com');
    expect(config.logLevel).toBe('info');
  });

  it('normalizes quoted env values for docker env-file compatibility', () => {
    const config = loadConfig({
      PORT: '3000',
      CONNECTOR_API_KEY: '"quoted-key"',
      BOT_ID: '"bot-id"',
      BOT_SECRET: '"bot-secret"',
      TENANT_ID: '"my-tenant-id"',
      BOT_SERVICE_URL: '"https://smba.trafficmanager.net/teams"',
      LOG_LEVEL: '"debug"',
    });

    expect(config.apiKey).toBe('quoted-key');
    expect(config.botId).toBe('bot-id');
    expect(config.botSecret).toBe('bot-secret');
    expect(config.tokenTenant).toBe('my-tenant-id');
    expect(config.botServiceUrl).toBe('https://smba.trafficmanager.net/teams');
    expect(config.logLevel).toBe('debug');
  });
});
