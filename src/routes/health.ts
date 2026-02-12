import { Router } from 'express';

import type { DeliveryAdapter } from '../adapters/types';

interface HealthRouteOptions {
  adapter: DeliveryAdapter;
  version: string;
  startedAt: number;
}

export function createHealthRouter(options: HealthRouteOptions): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const adapterHealthy = await options.adapter.healthCheck();

    res.json({
      status: adapterHealthy ? 'healthy' : 'degraded',
      version: options.version,
      adapter: 'botFramework',
      adapterHealthy,
      uptime: Math.floor((Date.now() - options.startedAt) / 1000),
    });
  });

  return router;
}
