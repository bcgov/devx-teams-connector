import type { AdaptiveCard, TemplateDataByName, TemplateName } from '../types';

import { ArgoCdTemplateDataSchema, renderArgoCdTemplate, summarizeArgoCdTemplate } from './argocd';
import { DbBackupTemplateDataSchema, renderDbBackupTemplate, summarizeDbBackupTemplate } from './dbbackup';
import { GenericTemplateDataSchema, renderGenericTemplate, summarizeGenericTemplate } from './generic';
import {
  GitHubPrTemplateDataSchema,
  GitHubWorkflowTemplateDataSchema,
  renderGitHubPrTemplate,
  renderGitHubWorkflowTemplate,
  summarizeGitHubPrTemplate,
  summarizeGitHubWorkflowTemplate,
} from './github';
import { SysdigTemplateDataSchema, renderSysdigTemplate, summarizeSysdigTemplate } from './sysdig';
import { UptimeTemplateDataSchema, renderUptimeTemplate, summarizeUptimeTemplate } from './uptime';
import { StatusCakeTemplateDataSchema, renderStatusCakeTemplate, summarizeStatusCakeTemplate } from './statuscake';

export const templateDataSchemas = {
  generic: GenericTemplateDataSchema,
  github_pull_request: GitHubPrTemplateDataSchema,
  github_workflow_run: GitHubWorkflowTemplateDataSchema,
  sysdig: SysdigTemplateDataSchema,
  uptime: UptimeTemplateDataSchema,
  db_backup: DbBackupTemplateDataSchema,
  argocd: ArgoCdTemplateDataSchema,
  statuscake: StatusCakeTemplateDataSchema,
} as const;

const templateRenderers: { [K in TemplateName]: (data: TemplateDataByName[K]) => AdaptiveCard } = {
  generic: renderGenericTemplate,
  github_pull_request: renderGitHubPrTemplate,
  github_workflow_run: renderGitHubWorkflowTemplate,
  sysdig: renderSysdigTemplate,
  uptime: renderUptimeTemplate,
  db_backup: renderDbBackupTemplate,
  argocd: renderArgoCdTemplate,
  statuscake: renderStatusCakeTemplate,
};

const templateSummarizers: { [K in TemplateName]: (data: TemplateDataByName[K]) => string } = {
  generic: summarizeGenericTemplate,
  github_pull_request: summarizeGitHubPrTemplate,
  github_workflow_run: summarizeGitHubWorkflowTemplate,
  sysdig: summarizeSysdigTemplate,
  uptime: summarizeUptimeTemplate,
  db_backup: summarizeDbBackupTemplate,
  argocd: summarizeArgoCdTemplate,
  statuscake: summarizeStatusCakeTemplate,
};

export function renderTemplate<T extends TemplateName>(
  template: T,
  data: TemplateDataByName[T],
): AdaptiveCard {
  return templateRenderers[template](data);
}

export function summarizeTemplate<T extends TemplateName>(
  template: T,
  data: TemplateDataByName[T],
): string {
  return templateSummarizers[template](data);
}

export type { TemplateName } from '../types';
