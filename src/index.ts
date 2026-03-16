import { loadConfig } from './config';
import { createLogger } from './logger';
import { createApp } from './app';
import { BotFrameworkAdapter } from './adapters/botFramework';

const config = loadConfig();
const logger = createLogger(config.logLevel);

const adapter = new BotFrameworkAdapter({
  botId: config.botId,
  botSecret: config.botSecret,
  serviceUrl: config.botServiceUrl,
  tokenTenant: config.tokenTenant,
});

const app = createApp({
  config,
  logger,
  adapter,
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Teams connector PoC listening');
});

server.requestTimeout = 30_000;
server.headersTimeout = 31_000;

const SHUTDOWN_TIMEOUT_MS = 10_000;

function shutdown(signal: string) {
  logger.info({ signal }, 'Received signal, shutting down');

  const forceTimer = setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();

  server.close((err) => {
    clearTimeout(forceTimer);
    if (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
    logger.info('Shutdown complete');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
