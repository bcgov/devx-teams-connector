import { z } from 'zod';

import type { AdaptiveCard, GenericTemplateData } from '../types';
import { createBaseCard, createCardFrame, toTextColor } from './shared';

const GenericSeveritySchema = z.enum(['critical', 'warning', 'info', 'success']);

export const GenericTemplateDataSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  severity: GenericSeveritySchema.optional(),
  url: z.string().url().optional(),
  urlLabel: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
}).strict();

const severityStyles: Record<NonNullable<GenericTemplateData['severity']>, 'attention' | 'warning' | 'accent' | 'good'> = {
  critical: 'attention',
  warning: 'warning',
  info: 'accent',
  success: 'good',
};

const severityLabels: Record<NonNullable<GenericTemplateData['severity']>, string> = {
  critical: '🔴 CRITICAL',
  warning: '⚠️ WARNING',
  info: 'INFO',
  success: '✅ SUCCESS',
};

export function renderGenericTemplate(data: GenericTemplateData): AdaptiveCard {
  const severity = data.severity ?? 'info';
  const contentItems: Array<Record<string, unknown>> = [];

  if (severity !== 'info') {
    contentItems.push({
      type: 'TextBlock',
      text: severityLabels[severity],
      size: 'Small',
      color: toTextColor(severityStyles[severity]),
      weight: 'Bolder',
      spacing: 'None',
    });
  }

  contentItems.push({
    type: 'TextBlock',
    text: data.title,
    weight: 'Bolder',
    size: 'Large',
    wrap: true,
    spacing: severity === 'info' ? 'None' : 'Small',
  });

  if (data.source) {
    contentItems.push({
      type: 'TextBlock',
      text: data.source,
      size: 'Small',
      isSubtle: true,
      spacing: 'None',
      wrap: true,
    });
  }

  if (data.body) {
    contentItems.push({
      type: 'TextBlock',
      text: data.body,
      wrap: true,
      size: 'Small',
      spacing: 'Medium',
    });
  }

  if (data.url) {
    contentItems.push({
      type: 'ActionSet',
      spacing: 'Medium',
      actions: [
        {
          type: 'Action.OpenUrl',
          title: data.urlLabel ?? 'View Details',
          url: data.url,
        },
      ],
    });
  }

  const body: Array<Record<string, unknown>> = [createCardFrame(contentItems)];

  return createBaseCard(body);
}
