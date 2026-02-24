import type { AdaptiveCard, TemplateDataByName, TemplateName } from '../types';

import { ArgoCdTemplateDataSchema, renderArgoCdTemplate } from './argocd';
import { DbBackupTemplateDataSchema, renderDbBackupTemplate } from './dbbackup';
import { GenericTemplateDataSchema, renderGenericTemplate } from './generic';
import { GitHubTemplateDataSchema, renderGitHubTemplate } from './github';
import { SysdigTemplateDataSchema, renderSysdigTemplate } from './sysdig';
import { UptimeTemplateDataSchema, renderUptimeTemplate } from './uptime';

export const templateDataSchemas = {
  generic: GenericTemplateDataSchema,
  github: GitHubTemplateDataSchema,
  sysdig: SysdigTemplateDataSchema,
  uptime: UptimeTemplateDataSchema,
  db_backup: DbBackupTemplateDataSchema,
  argocd: ArgoCdTemplateDataSchema,
} as const;

const templateRenderers: { [K in TemplateName]: (data: TemplateDataByName[K]) => AdaptiveCard } = {
  generic: renderGenericTemplate,
  github: renderGitHubTemplate,
  sysdig: renderSysdigTemplate,
  uptime: renderUptimeTemplate,
  db_backup: renderDbBackupTemplate,
  argocd: renderArgoCdTemplate,
};

export function renderTemplate<T extends TemplateName>(
  template: T,
  data: TemplateDataByName[T],
): AdaptiveCard {
  return templateRenderers[template](data);
}

export type { TemplateName } from '../types';
