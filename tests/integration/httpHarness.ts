import { EventEmitter } from 'node:events';
import type { Express } from 'express';
import { createRequest, createResponse } from 'node-mocks-http';

interface InvokeOptions {
  method: 'GET' | 'POST';
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface InvokeResult {
  status: number;
  headers: Record<string, unknown>;
  body: unknown;
}

export function invokeApp(app: Express, options: InvokeOptions): Promise<InvokeResult> {
  return new Promise((resolve, reject) => {
    const req = createRequest({
      method: options.method,
      url: options.path,
      headers: options.headers ?? {},
      body: options.body,
    });

    const res = createResponse({
      eventEmitter: EventEmitter,
    });

    const finalize = () => {
      const data = res._getData();
      let body: unknown = data;

      if (typeof data === 'string') {
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
      }

      resolve({
        status: res.statusCode,
        headers: res._getHeaders(),
        body,
      });
    };

    res.on('end', finalize);

    app.handle(req, res, (error: unknown) => {
      if (error) {
        reject(error);
        return;
      }

      if (!res.writableEnded) {
        finalize();
      }
    });
  });
}
