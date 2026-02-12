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

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Teams connector PoC listening');
});
