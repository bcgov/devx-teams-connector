import { z } from 'zod';

import type { AdaptiveCard, SysdigTemplateData } from '../types';
import {
  IsoTimestampSchema,
  createBaseCard,
  createCardFrame,
  createFactSet,
  createSectionSeparator,
  formatRelativeTimeOrIso,
} from './shared';

export const SysdigTemplateDataSchema = z.object({
  severity: z.number().int().min(0).max(7), // alert.severity (0=critical, 1=high, 2-3=medium, 4-5=low, 6-7=info)
  alertName: z.string().min(1).max(200), // alert.name
  state: z.enum(['active', 'ok']).optional(), // alert.state
  scope: z.string().min(1).optional(), // alert.scope
  description: z.string().min(1).optional(), // alert.description
  timestamp: IsoTimestampSchema.optional(), // timestamp
  url: z.string().url().optional(), // alert.editUrl
});

const severityColors: Record<SysdigTemplateData['severity'], string> = {
  critical: 'Attention',
  high: 'Warning',
  medium: 'Warning',
  low: 'Accent',
  info: 'Default',
};

const severityFactLabels: Record<SysdigTemplateData['severity'], string> = {
  critical: '🔴 Critical',
  high: '🟠 High',
  medium: '🟡 Medium',
  low: '🔵 Low',
  info: 'ℹ️ Info',
};

export function renderSysdigTemplate(data: SysdigTemplateData): AdaptiveCard {
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
              text: `${data.severity.toUpperCase()} ALERT`,
              size: 'Small',
              color: severityColors[data.severity],
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
      text: data.alertName,
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
    { title: 'Scope', value: data.scope },
    { title: 'Severity', value: severityFactLabels[data.severity] },
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
