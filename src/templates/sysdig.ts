import { z } from 'zod';

import type { AdaptiveCard, SysdigTemplateData } from '../types';
import {
  IsoTimestampSchema,
  createActivitySummary,
  createBaseCard,
  createCardFrame,
  createFactSet,
  createSectionSeparator,
  formatRelativeTimeOrIso,
} from './shared';

const SysdigStateSchema = z
  .enum(['ACTIVE', 'OK', 'active', 'ok'])
  .transform((state): 'ACTIVE' | 'OK' => state.toUpperCase() as 'ACTIVE' | 'OK');

export const SysdigTemplateDataSchema = z.object({
  severity: z.number().int().min(0).max(7), // alert.severity (0=critical, 1=high, 2-3=medium, 4-5=low, 6-7=info)
  alertName: z.string().min(1).max(200), // alert.name
  subject: z.string().min(1).max(500).optional(), // alert.subject
  state: SysdigStateSchema.optional(), // state; legacy lowercase values are normalized
  scope: z.string().min(1).optional(), // alert.scope
  description: z.string().min(1).optional(), // alert.description
  timestamp: IsoTimestampSchema.optional(), // timestamp
  url: z.string().url().optional(), // alert.editUrl
});

type SeverityLabel = 'critical' | 'high' | 'medium' | 'low' | 'info';

function toSeverityLabel(severity: number): SeverityLabel {
  if (severity === 0) return 'critical';
  if (severity === 1) return 'high';
  if (severity <= 3) return 'medium';
  if (severity <= 5) return 'low';
  return 'info';
}

const severityColors: Record<SeverityLabel, string> = {
  critical: 'Attention',
  high: 'Warning',
  medium: 'Warning',
  low: 'Accent',
  info: 'Default',
};

const severityFactLabels: Record<SeverityLabel, string> = {
  critical: '🔴 Critical',
  high: '🟠 High',
  medium: '🟡 Medium',
  low: '🔵 Low',
  info: 'ℹ️ Info',
};

export function summarizeSysdigTemplate(data: SysdigTemplateData): string {
  const state = data.state ?? 'alert';
  const title = data.subject ?? data.alertName;

  return createActivitySummary([`Sysdig ${state}: ${title}`, data.description]);
}

export function renderSysdigTemplate(data: SysdigTemplateData): AdaptiveCard {
  const label = toSeverityLabel(data.severity);
  const title = data.subject ?? data.alertName;
  const contentItems: Array<Record<string, unknown>> = [
    {
      type: 'ColumnSet',
      spacing: 'None',
      columns: [
        {
          type: 'Column',
          width: 'stretch',
          items: [
            {
              type: 'TextBlock',
              text: `${label.toUpperCase()} ALERT`,
              size: 'Small',
              color: severityColors[label],
              weight: 'Bolder',
              spacing: 'None',
            },
          ],
        },
        {
          type: 'Column',
          width: 'auto',
          items: [
            {
              type: 'TextBlock',
              text: 'Sysdig',
              size: 'Small',
              isSubtle: true,
              spacing: 'None',
            },
          ],
        },
      ],
    },
    {
      type: 'TextBlock',
      text: title,
      weight: 'Bolder',
      size: 'Large',
      wrap: true,
      spacing: 'Small',
    },
  ];

  if (data.description) {
    contentItems.push({
      type: 'TextBlock',
      text: data.description,
      wrap: true,
      size: 'Small',
      isSubtle: true,
      spacing: 'Small',
    });
  }

  const factSet = createFactSet([
    { title: 'State', value: data.state },
    { title: 'Scope', value: data.scope },
    { title: 'Severity', value: severityFactLabels[label] },
    {
      title: 'Fired at',
      value: data.timestamp ? formatRelativeTimeOrIso(data.timestamp) : undefined,
    },
  ]);

  if (factSet) {
    contentItems.push(createSectionSeparator());
    contentItems.push(factSet);
  }

  if (data.url) {
    contentItems.push({
      type: 'ActionSet',
      spacing: 'Medium',
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'View in Sysdig',
          url: data.url,
        },
      ],
    });
  }

  const body: Array<Record<string, unknown>> = [createCardFrame(contentItems)];

  return createBaseCard(body);
}
