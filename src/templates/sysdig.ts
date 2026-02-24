import { z } from 'zod';

import type { AdaptiveCard, SysdigTemplateData } from '../types';
import { createBaseCard, createCardFrame, createFactSet, createSectionSeparator, formatRelativeTimeOrIso } from './shared';

const IsoTimestampSchema = z.union([
  z.string().datetime({ offset: true }),
  z.string().datetime(),
]);

export const SysdigTemplateDataSchema = z.object({
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  alertName: z.string().min(1),
  scope: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  timestamp: IsoTimestampSchema.optional(),
  url: z.string().url().optional(),
}).strict();

const severityStyles: Record<SysdigTemplateData['severity'], 'attention' | 'warning' | 'accent' | 'default'> = {
  critical: 'attention',
  high: 'warning',
  medium: 'warning',
  low: 'accent',
  info: 'default',
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
              color:
                data.severity === 'critical'
                  ? 'Attention'
                  : data.severity === 'low'
                    ? 'Accent'
                    : data.severity === 'info'
                      ? 'Default'
                      : 'Warning',
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

  const body: Array<Record<string, unknown>> = [
    createCardFrame(severityStyles[data.severity], contentItems),
  ];

  return createBaseCard(body);
}
