export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_FAILED'
  | 'UNAUTHORIZED_CHANNEL'
  | 'CHANNEL_NOT_FOUND'
  | 'CARD_SCHEMA_ERROR'
  | 'TEMPLATE_NOT_FOUND'
  | 'TEMPLATE_DATA_ERROR'
  | 'RATE_LIMITED'
  | 'BACKEND_UNAVAILABLE'
  | 'DELIVERY_FAILED'
  | 'NOT_FOUND';

export class ConnectorError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly retryable: boolean;
  public readonly headers?: Record<string, string>;

  constructor(
    code: ErrorCode,
    message: string,
    httpStatus: number,
    retryable: boolean,
    headers?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ConnectorError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.retryable = retryable;
    this.headers = headers;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    };
  }
}

export function toConnectorError(error: unknown): ConnectorError {
  if (error instanceof ConnectorError) {
    return error;
  }

  // express.json() sets type = 'entity.parse.failed' and status = 400 on malformed JSON
  if (
    error instanceof SyntaxError &&
    'status' in error &&
    (error as { status: unknown }).status === 400 &&
    'type' in error &&
    (error as { type: unknown }).type === 'entity.parse.failed'
  ) {
    return new ConnectorError(
      'VALIDATION_ERROR',
      'Malformed JSON in request body.',
      400,
      false,
    );
  }

  return new ConnectorError(
    'DELIVERY_FAILED',
    'Unexpected internal error during message processing.',
    500,
    true,
  );
}
