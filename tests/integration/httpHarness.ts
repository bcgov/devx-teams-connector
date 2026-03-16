import type { Express } from 'express';
import request from 'supertest';

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

export async function invokeApp(app: Express, options: InvokeOptions): Promise<InvokeResult> {
  const req = options.method === 'GET'
    ? request(app).get(options.path)
    : request(app).post(options.path);

  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      req.set(key, value);
    }
  }

  if (options.body !== undefined) {
    req.send(options.body as object);
  }

  const response = await req;

  return {
    status: response.status,
    headers: response.headers,
    body: response.body,
  };
}
