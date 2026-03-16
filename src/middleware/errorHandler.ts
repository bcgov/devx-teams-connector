import type { ErrorRequestHandler } from 'express';

import { ConnectorError, toConnectorError } from '../errors';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const connectorError = toConnectorError(error);

  if (connectorError.headers) {
    for (const [header, value] of Object.entries(connectorError.headers)) {
      res.setHeader(header, value);
    }
  }

  const logPayload: Record<string, unknown> = {
    code: connectorError.code,
    message: connectorError.message,
    httpStatus: connectorError.httpStatus,
    retryable: connectorError.retryable,
  };

  if (!(error instanceof ConnectorError)) {
    logPayload.originalError = error instanceof Error ? error.stack ?? error.message : String(error);
  }

  req.log?.error(logPayload, 'Request failed');

  res.status(connectorError.httpStatus).json(connectorError.toJSON());
};
