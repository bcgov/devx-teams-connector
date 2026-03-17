import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('loads required values and defaults', () => {
    const config = loadConfig({
      PORT: '3000',
      CONNECTOR_API_KEY: 'a-valid-api-key-that-is-at-least-32-characters',
      BOT_ID: 'bot-id',
      BOT_SECRET: 'bot-secret',
    });

    expect(config.port).toBe(3000);
    expect(config.apiKey).toBe('a-valid-api-key-that-is-at-least-32-characters');
    expect(config.botServiceUrl).toBe('https://smba.trafficmanager.net/teams');
    expect(config.tokenTenant).toBe('botframework.com');
    expect(config.logLevel).toBe('info');
  });

  it('normalizes quoted env values for docker env-file compatibility', () => {
    const config = loadConfig({
      PORT: '3000',
      CONNECTOR_API_KEY: '"a-valid-quoted-key-that-is-at-least-32-chars"',
      BOT_ID: '"bot-id"',
      BOT_SECRET: '"bot-secret"',
      TENANT_ID: '"my-tenant-id"',
      BOT_SERVICE_URL: '"https://smba.trafficmanager.net/teams"',
      LOG_LEVEL: '"debug"',
    });

    expect(config.apiKey).toBe('a-valid-quoted-key-that-is-at-least-32-chars');
    expect(config.botId).toBe('bot-id');
    expect(config.botSecret).toBe('bot-secret');
    expect(config.tokenTenant).toBe('my-tenant-id');
    expect(config.botServiceUrl).toBe('https://smba.trafficmanager.net/teams');
    expect(config.logLevel).toBe('debug');
  });

  it('throws when CONNECTOR_API_KEY is shorter than 32 characters', () => {
    expect(() =>
      loadConfig({
        PORT: '3000',
        CONNECTOR_API_KEY: 'too-short',
        BOT_ID: 'bot-id',
        BOT_SECRET: 'bot-secret',
      }),
    ).toThrow(/CONNECTOR_API_KEY must be at least 32 characters/);
  });
});
