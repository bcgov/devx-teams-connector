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

export interface GitHubTemplateData {
  event: 'opened' | 'merged' | 'closed';
  title: string;
  repo: string;
  author: string;
  url: string;
  body?: string;
}

export interface SysdigTemplateData {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  alertName: string;
  scope?: string;
  description?: string;
  timestamp?: string;
  url?: string;
}

export interface UptimeTemplateData {
  status: 'up' | 'degraded' | 'down';
  service: string;
  responseTimeMs?: number;
  downSince?: string;
  url?: string;
}

export interface DbBackupTemplateData {
  status: 'success' | 'warning' | 'failed';
  database: string;
  duration?: string;
  size?: string;
  message?: string;
  container?: string;
}

export interface ArgoCdTemplateData {
  event: 'sync_succeeded' | 'sync_failed' | 'out_of_sync';
  application: string;
  syncStatus?: 'Synced' | 'OutOfSync' | 'Unknown';
  healthStatus?: 'Healthy' | 'Degraded' | 'Progressing' | 'Missing' | 'Suspended' | 'Unknown';
  revision?: string;
  project?: string;
  target?: string;
  timestamp?: string;
  message?: string;
  url?: string;
}

export type TemplateName = 'generic' | 'github' | 'sysdig' | 'uptime' | 'db_backup' | 'argocd';

export interface TemplateDataByName {
  generic: GenericTemplateData;
  github: GitHubTemplateData;
  sysdig: SysdigTemplateData;
  uptime: UptimeTemplateData;
  db_backup: DbBackupTemplateData;
  argocd: ArgoCdTemplateData;
}

export interface TextContent {
  kind: 'text';
  text: string;
}

export interface GenericTemplateContent {
  kind: 'template';
  template: 'generic';
  data: GenericTemplateData;
}

export interface GitHubTemplateContent {
  kind: 'template';
  template: 'github';
  data: GitHubTemplateData;
}

export interface SysdigTemplateContent {
  kind: 'template';
  template: 'sysdig';
  data: SysdigTemplateData;
}

export interface UptimeTemplateContent {
  kind: 'template';
  template: 'uptime';
  data: UptimeTemplateData;
}

export interface DbBackupTemplateContent {
  kind: 'template';
  template: 'db_backup';
  data: DbBackupTemplateData;
}

export interface ArgoCdTemplateContent {
  kind: 'template';
  template: 'argocd';
  data: ArgoCdTemplateData;
}

export type TemplateContent =
  | GenericTemplateContent
  | GitHubTemplateContent
  | SysdigTemplateContent
  | UptimeTemplateContent
  | DbBackupTemplateContent
  | ArgoCdTemplateContent;

export type Content = TextContent | TemplateContent;

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
