export interface Target {
  teamId: string;
  channelId: string;
}

export interface GenericTemplateData {
  title: string;
  body?: string;
  severity?: 'critical' | 'warning' | 'info' | 'success';
  url?: string;
  urlLabel?: string;
  source?: string;
}

export interface TextContent {
  kind: 'text';
  text: string;
}

export interface GenericTemplateContent {
  kind: 'template';
  template: 'generic';
  data: unknown;
}

export type Content = TextContent | GenericTemplateContent;

export interface SendMessageRequest {
  target: Target;
  content: Content;
  metadata?: Record<string, string>;
}

export interface MessageAccepted {
  id: string;
  status: 'accepted';
  timestamp: string;
}

export interface AdaptiveCard {
  type: 'AdaptiveCard';
  '$schema': string;
  version: string;
  body: Array<Record<string, unknown>>;
  actions?: Array<Record<string, unknown>>;
}
