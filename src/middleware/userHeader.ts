import type { RequestHandler } from 'express';

import { ConnectorError } from '../errors';

export function requireUserEntraId(): RequestHandler {
  return (req, res, next) => {
    const userEntraId = req.header('x-user-entra-id');

    if (!userEntraId) {
      return next(new ConnectorError('AUTH_FAILED', 'Missing X-User-Entra-Id header.', 401, false));
    }

    res.locals.userEntraId = userEntraId;
    return next();
  };
}
