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

function shutdown(signal: string) {
  logger.info({ signal }, 'Received signal, shutting down');
  server.close((err) => {
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
