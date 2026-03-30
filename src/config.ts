import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import dotenv from 'dotenv';

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

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (env === process.env) dotenv.config();
  const portRaw = env.PORT ?? '3000';
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const apiKey = getRequiredEnv(env, 'CONNECTOR_API_KEY');
  if (apiKey.length < 32) {
    throw new Error(
      `CONNECTOR_API_KEY must be at least 32 characters (got ${apiKey.length}). Use a strong, randomly generated secret.`,
    );
  }

  return {
    port,
    apiKey,
    botId: getRequiredEnv(env, 'BOT_ID'),
    botSecret: getRequiredEnv(env, 'BOT_SECRET'),
    botServiceUrl: normalizeEnvValue(env.BOT_SERVICE_URL ?? 'https://smba.trafficmanager.net/teams'),
    tokenTenant: normalizeEnvValue(env.BOT_TOKEN_TENANT ?? env.TENANT_ID ?? 'botframework.com'),
    logLevel: normalizeEnvValue(env.LOG_LEVEL ?? 'info'),
    version: env.npm_package_version ?? readPackageVersion(),
  };
}
