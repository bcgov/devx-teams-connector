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
    let adapterHealthy: boolean;
    try {
      adapterHealthy = await options.adapter.healthCheck();
    } catch {
      adapterHealthy = false;
    }

    res.json({
      status: adapterHealthy ? 'healthy' : 'degraded',
      version: options.version,
      adapter: 'botFramework',
      adapterHealthy,
      uptime: Math.floor((Date.now() - options.startedAt) / 1000),
    });
  });

  router.get('/live', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/ready', async (_req, res) => {
    let adapterHealthy: boolean;
    try {
      adapterHealthy = await options.adapter.healthCheck();
    } catch {
      adapterHealthy = false;
    }

    const status = adapterHealthy ? 'ok' : 'unavailable';
    res.status(adapterHealthy ? 200 : 503).json({ status });
  });

  return router;
}
