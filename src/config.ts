import dotenv from 'dotenv';

export interface Config {
  port: number;
  apiKeys: {
    primary: string;
    legacy?: string;
  };
  botId: string;
  botSecret: string;
  botServiceUrl: string;
  tokenTenant: string;
  logLevel: string;
  allowCardPassthrough: boolean;
}

function normalizeEnvValue(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getBooleanEnv(env: NodeJS.ProcessEnv, key: string): boolean {
  const value = env[key];
  if (!value) {
    return false;
  }

  const normalized = normalizeEnvValue(value).toLowerCase();
  return normalized === 'true';
}

function getRequiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    throw new Error(`Environment variable ${key} is empty after normalization.`);
  }

  return normalized;
}

function getOptionalEnv(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key];
  if (value === undefined) {
    return undefined;
  }

  const normalized = normalizeEnvValue(value);
  return normalized || undefined;
}

function validateApiKey(apiKey: string, key: string): void {
  if (apiKey.length < 32) {
    throw new Error(
      `${key} must be at least 32 characters (got ${apiKey.length}). Use a strong, randomly generated secret.`,
    );
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (env === process.env) dotenv.config();
  const portRaw = env.PORT ?? '3000';
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const primaryApiKey = getRequiredEnv(env, 'CONNECTOR_API_KEY');
  validateApiKey(primaryApiKey, 'CONNECTOR_API_KEY');

  const legacyApiKey = getOptionalEnv(env, 'CONNECTOR_API_KEY_LEGACY');
  if (legacyApiKey) {
    validateApiKey(legacyApiKey, 'CONNECTOR_API_KEY_LEGACY');
    if (legacyApiKey === primaryApiKey) {
      throw new Error('CONNECTOR_API_KEY_LEGACY must differ from the primary API key.');
    }
  }

  return {
    port,
    apiKeys: {
      primary: primaryApiKey,
      ...(legacyApiKey && { legacy: legacyApiKey }),
    },
    botId: getRequiredEnv(env, 'BOT_ID'),
    botSecret: getRequiredEnv(env, 'BOT_SECRET'),
    botServiceUrl: normalizeEnvValue(env.BOT_SERVICE_URL ?? 'https://smba.trafficmanager.net/teams'),
    tokenTenant: normalizeEnvValue(env.BOT_TOKEN_TENANT ?? env.TENANT_ID ?? 'botframework.com'),
    logLevel: normalizeEnvValue(env.LOG_LEVEL ?? 'info'),
    allowCardPassthrough: getBooleanEnv(env, 'ALLOW_CARD_PASSTHROUGH'),
  };
}
