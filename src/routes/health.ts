import { Router } from 'express';

interface HealthRouteOptions {
  version: string;
  startedAt: number;
}

export function createHealthRouter(options: HealthRouteOptions): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      version: options.version,
      uptime: Math.floor((Date.now() - options.startedAt) / 1000),
    });
  });

  router.get('/live', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/ready', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}
