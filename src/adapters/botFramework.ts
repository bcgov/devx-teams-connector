import { ConnectorError } from '../errors';
import type { DeliveryAdapter, DeliveryPayload, DeliveryResult } from './types';

interface BotFrameworkConfig {
  botId: string;
  botSecret: string;
  serviceUrl: string;
  tokenTenant: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

export class BotFrameworkAdapter implements DeliveryAdapter {
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly config: BotFrameworkConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private tokenEndpoint(): string {
    return `https://login.microsoftonline.com/${this.config.tokenTenant}/oauth2/v2.0/token`;
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 300_000) {
      return this.token;
    }

    const tokenResponse = await this.fetchImpl(this.tokenEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.botId,
        client_secret: this.config.botSecret,
        scope: 'https://api.botframework.com/.default',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!tokenResponse.ok) {
      throw new ConnectorError(
        'BACKEND_UNAVAILABLE',
        `Failed to acquire Bot Framework token: HTTP ${tokenResponse.status}`,
        502,
        true,
      );
    }

    const tokenData = (await tokenResponse.json()) as Partial<TokenResponse>;
    if (!tokenData.access_token || !tokenData.expires_in) {
      throw new ConnectorError('BACKEND_UNAVAILABLE', 'Invalid Bot Framework token response.', 502, true);
    }

    this.token = tokenData.access_token;
    this.tokenExpiresAt = Date.now() + tokenData.expires_in * 1000;

    return this.token;
  }

  async send(payload: DeliveryPayload): Promise<DeliveryResult> {
    try {
      let result = await this.sendOnce(payload);
      if (!result.success && result.httpStatus === 401) {
        this.token = null;
        this.tokenExpiresAt = 0;
        result = await this.sendOnce(payload);
      }
      // Remap upstream 401 to 502 so it doesn't collide with client auth semantics
      if (!result.success && result.httpStatus === 401) {
        return { ...result, httpStatus: 502 };
      }
      return result;
    } catch (error) {
      if (error instanceof ConnectorError) throw error;
      const message =
        error instanceof Error ? error.message : 'Unknown transport error';
      return {
        success: false,
        error: `Upstream transport failure: ${message}`,
        retryable: true,
        errorCode: 'BACKEND_UNAVAILABLE',
        httpStatus: 502,
      };
    }
  }

  private async sendOnce(payload: DeliveryPayload): Promise<DeliveryResult> {
    const token = await this.getToken();
    const serviceUrl = this.config.serviceUrl.replace(/\/$/, '');
    const endpoint = `${serviceUrl}/v3/conversations`;

    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isGroup: true,
        channelData: {
          channel: { id: payload.channelId },
          team: { id: payload.teamId },
        },
        activity: payload.activity,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as { id?: string; activityId?: string };
      return {
        success: true,
        teamsMessageId: data.activityId ?? data.id,
      };
    }

    const fallbackError = `Bot Framework request failed with HTTP ${response.status}.`;
    const responseText = await response.text().catch(() => '');
    let error = fallbackError;

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText) as unknown;
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'message' in parsed &&
          typeof (parsed as { message?: unknown }).message === 'string'
        ) {
          error = (parsed as { message: string }).message;
        } else {
          error = `${fallbackError} ${responseText}`;
        }
      } catch {
        error = `${fallbackError} ${responseText}`;
      }
    }

    if (response.status === 401) {
      return {
        success: false,
        error,
        retryable: true,
        errorCode: 'BACKEND_UNAVAILABLE',
        httpStatus: 401,
      };
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      return {
        success: false,
        error,
        retryable: true,
        errorCode: 'RATE_LIMITED',
        httpStatus: 429,
        headers: retryAfter ? { 'Retry-After': retryAfter } : undefined,
      };
    }

    if (response.status >= 500) {
      return {
        success: false,
        error,
        retryable: true,
        errorCode: 'BACKEND_UNAVAILABLE',
        httpStatus: 502,
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error,
        retryable: false,
        errorCode: 'UNAUTHORIZED_CHANNEL',
        httpStatus: 403,
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error,
        retryable: false,
        errorCode: 'CHANNEL_NOT_FOUND',
        httpStatus: 404,
      };
    }

    return {
      success: false,
      error,
      retryable: false,
      errorCode: 'DELIVERY_FAILED',
      httpStatus: response.status >= 400 && response.status < 500 ? response.status : 500,
    };
  }

  async healthCheck(): Promise<boolean> {
    // No token yet means no requests have been made — that's fine, we're ready to accept work
    if (this.token === null) return true;
    return Date.now() < this.tokenExpiresAt;
  }
}
