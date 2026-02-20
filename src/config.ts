import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
  apiKey: string;
  botId: string;
  botSecret: string;
  botServiceUrl: string;
  tokenTenant: string;
  logLevel: string;
  version: string;
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

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const portRaw = env.PORT ?? '3000';
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  return {
    port,
    apiKey: getRequiredEnv(env, 'CONNECTOR_API_KEY'),
    botId: getRequiredEnv(env, 'BOT_ID'),
    botSecret: getRequiredEnv(env, 'BOT_SECRET'),
    botServiceUrl: normalizeEnvValue(env.BOT_SERVICE_URL ?? 'https://smba.trafficmanager.net/teams'),
    tokenTenant: normalizeEnvValue(env.BOT_TOKEN_TENANT ?? env.TENANT_ID ?? 'botframework.com'),
    logLevel: normalizeEnvValue(env.LOG_LEVEL ?? 'info'),
    version: env.npm_package_version ?? '1.0.0',
  };
}
