import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

import type { Config } from '../config';
import { ConnectorError } from '../errors';

function constantTimeCompare(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function apiKeyAuth(expectedApiKeys: Config['apiKeys']): RequestHandler {
  return (req, _res, next) => {
    const authHeader = req.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ConnectorError('AUTH_FAILED', 'Missing Authorization header.', 401, false));
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const candidates = [expectedApiKeys.primary];
    if (expectedApiKeys.legacy) {
      candidates.push(expectedApiKeys.legacy);
    }
    let matches = false;

    // compare every configured key so a match does not short-circuit the loop.
    for (const candidate of candidates) {
      const candidateMatches = constantTimeCompare(token, candidate);
      matches = candidateMatches || matches;
    }

    if (!matches) {
      return next(new ConnectorError('AUTH_FAILED', 'Invalid API key.', 401, false));
    }

    return next();
  };
}
