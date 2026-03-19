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

export interface GitHubPrTemplateData {
  event: string;
  title: string;
  repo: string;
  author: string;
  url: string;
  body?: string;
}

export interface GitHubWorkflowTemplateData {

}

export interface SysdigTemplateData {
  severity: number;
  alertName: string;
  state?: 'active' | 'ok';
  scope?: string;
  description?: string;
  timestamp?: string;
  url?: string;
}

export interface UptimeTemplateData {
  status: 'up' | 'down';
  service: string;
  downSince?: string;
  url?: string;
}

export interface DbBackupTemplateData {
  status: 'info' | 'warn' | 'error';
  projectName: string;
  ProjectFriendlyName: string;
  message?: string;
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

export type TemplateName = 'generic' | 'github-pull_request' | 'github-workflow' | 'sysdig' | 'uptime' | 'db_backup' | 'argocd';

export interface TemplateDataByName {
  generic: GenericTemplateData;
  'github-pull_request': GitHubPrTemplateData;
  'github-workflow': GitHubWorkflowTemplateData;
  sysdig: SysdigTemplateData;
  uptime: UptimeTemplateData;
  db_backup: DbBackupTemplateData;
  argocd: ArgoCdTemplateData;
}

export interface TextContent {
  kind: 'text';
  text: string;
}

export interface HtmlContent {
  kind: 'html';
  text: string;
}

export interface GenericTemplateContent {
  kind: 'template';
  template: 'generic';
  data: GenericTemplateData;
}

export interface GitHubPrTemplateContent {
  kind: 'template';
  template: 'github-pull_request';
  data: GitHubPrTemplateData;
}

export interface GitHubWorkflowTemplateContent {
  kind: 'template';
  template: 'github-workflow';
  data: GitHubWorkflowTemplateData;
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
  | GitHubPrTemplateContent
  | GitHubWorkflowTemplateContent
  | SysdigTemplateContent
  | UptimeTemplateContent
  | DbBackupTemplateContent
  | ArgoCdTemplateContent;

export type Content = TextContent | HtmlContent | TemplateContent;

export interface SendMessageRequest {
  target: Target;
  content: Content;
  metadata?: Record<string, string>;
}

export interface MessageAccepted {
  id: string;
  status: 'delivered';
  timestamp: string;
}

export interface AdaptiveCard {
  type: 'AdaptiveCard';
  '$schema': string;
  version: string;
  body: Array<Record<string, unknown>>;
  actions?: Array<Record<string, unknown>>;
}
