import { randomUUID } from 'node:crypto';
import express, { type Express, Router } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import type { Logger } from 'pino';

import rateLimit from 'express-rate-limit';

import type { Config } from './config';
import { ConnectorError } from './errors';
import { errorHandler } from './middleware/errorHandler';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import type { DeliveryAdapter } from './adapters/types';
import { MessageService } from './services/messageService';
import { createMessagesRouter } from './routes/messages';
import { createHealthRouter } from './routes/health';

interface AppOptions {
  config: Config;
  logger: Logger;
  adapter: DeliveryAdapter;
  enableHttpLogging?: boolean;
}

export function createApp(options: AppOptions): Express {
  const app = express();
  const apiRouter = Router();
  const startedAt = Date.now();

  app.use(helmet());
  app.use(express.json({ limit: '256kb' }));
  if (options.enableHttpLogging ?? true) {
    app.use(
      pinoHttp({
        logger: options.logger,
        autoLogging: true,
        genReqId: (req) => req.headers['x-request-id'] ?? randomUUID(),
      }),
    );
  }

  const messageService = new MessageService(options.adapter, options.logger);

  apiRouter.use(createHealthRouter({
    version: options.config.version,
    startedAt,
  }));

  apiRouter.use(rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }));
  apiRouter.use(apiKeyAuth(options.config.apiKey));
  apiRouter.use(rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: () => 'global',
  }));
  apiRouter.use(createMessagesRouter(messageService));

  app.use('/api/v1', apiRouter);

  app.use((_req, _res, next) => {
    next(new ConnectorError('NOT_FOUND', 'Route not found.', 404, false));
  });

  app.use(errorHandler);

  return app;
}
