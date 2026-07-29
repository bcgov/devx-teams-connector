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
    expect(config.apiKeys).toEqual({
      primary: 'a-valid-api-key-that-is-at-least-32-characters',
    });
    expect(config.botServiceUrl).toBe('https://smba.trafficmanager.net/teams');
    expect(config.tokenTenant).toBe('botframework.com');
    expect(config.logLevel).toBe('info');
    expect(config.allowCardPassthrough).toBe(false);
  });

  it('parses ALLOW_CARD_PASSTHROUGH as a boolean flag', () => {
    const base = {
      PORT: '3000',
      CONNECTOR_API_KEY: 'a-valid-api-key-that-is-at-least-32-characters',
      BOT_ID: 'bot-id',
      BOT_SECRET: 'bot-secret',
    };

    expect(loadConfig({ ...base, ALLOW_CARD_PASSTHROUGH: 'true' }).allowCardPassthrough).toBe(true);
    expect(loadConfig({ ...base, ALLOW_CARD_PASSTHROUGH: 'TRUE' }).allowCardPassthrough).toBe(true);
    expect(loadConfig({ ...base, ALLOW_CARD_PASSTHROUGH: '"1"' }).allowCardPassthrough).toBe(false);
    expect(loadConfig({ ...base, ALLOW_CARD_PASSTHROUGH: 'YES' }).allowCardPassthrough).toBe(false);
    expect(loadConfig({ ...base, ALLOW_CARD_PASSTHROUGH: 'false' }).allowCardPassthrough).toBe(false);
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

    expect(config.apiKeys.primary).toBe('a-valid-quoted-key-that-is-at-least-32-chars');
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

  it('loads primary and legacy keys for an overlap window', () => {
    const config = loadConfig({
      CONNECTOR_API_KEY: 'primary-api-key-that-is-at-least-32-characters',
      CONNECTOR_API_KEY_LEGACY: 'legacy-api-key-that-is-at-least-32-characters',
      BOT_ID: 'bot-id',
      BOT_SECRET: 'bot-secret',
    });

    expect(config.apiKeys).toEqual({
      primary: 'primary-api-key-that-is-at-least-32-characters',
      legacy: 'legacy-api-key-that-is-at-least-32-characters',
    });
  });

  it('rejects a legacy key shorter than 32 characters', () => {
    expect(() =>
      loadConfig({
        CONNECTOR_API_KEY: 'primary-api-key-that-is-at-least-32-characters',
        CONNECTOR_API_KEY_LEGACY: 'too-short',
        BOT_ID: 'bot-id',
        BOT_SECRET: 'bot-secret',
      }),
    ).toThrow(/CONNECTOR_API_KEY_LEGACY must be at least 32 characters/);
  });

  it('rejects identical primary and legacy keys', () => {
    const apiKey = 'same-api-key-that-is-at-least-32-characters';

    expect(() =>
      loadConfig({
        CONNECTOR_API_KEY: apiKey,
        CONNECTOR_API_KEY_LEGACY: apiKey,
        BOT_ID: 'bot-id',
        BOT_SECRET: 'bot-secret',
      }),
    ).toThrow(/CONNECTOR_API_KEY_LEGACY must differ/);
  });
});
