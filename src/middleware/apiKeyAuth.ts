import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

import { ConnectorError } from '../errors';

function constantTimeCompare(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);

  if (leftBuf.length !== rightBuf.length) {
    return false;
  }

  return timingSafeEqual(leftBuf, rightBuf);
}

export function apiKeyAuth(expectedApiKey: string): RequestHandler {
  return (req, _res, next) => {
    const authHeader = req.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ConnectorError('AUTH_FAILED', 'Missing Authorization header.', 401, false));
    }

    const token = authHeader.slice('Bearer '.length).trim();

    if (!constantTimeCompare(token, expectedApiKey)) {
      return next(new ConnectorError('AUTH_FAILED', 'Invalid API key.', 401, false));
    }

    return next();
  };
}
