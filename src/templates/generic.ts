import { z } from 'zod';

import type { AdaptiveCard, GenericTemplateData } from '../types';
import {
  boundedString,
  createActivitySummary,
  createBaseCard,
  createCardFrame,
  optionalBoundedString,
  optionalField,
  toTextColor,
} from './shared';

const GenericSeveritySchema = z.enum([
  'critical',
  'warning',
  'info',
  'success',
  'error',
  'debug',
  'unknown',
  'trace',
]);

export const GenericTemplateDataSchema = z.object({
  title: boundedString(200),
  body: optionalBoundedString(2000),
  severity: optionalField(GenericSeveritySchema),
  url: optionalField(z.string().url()),
  urlLabel: optionalField(z.string()),
  source: optionalField(z.string()),
});

const severityStyles: Record<
  NonNullable<GenericTemplateData['severity']>,
  'default' | 'attention' | 'warning' | 'accent' | 'good'
> = {
  critical: 'attention',
  warning: 'warning',
  info: 'accent',
  success: 'good',
  error: 'attention',
  debug: 'accent',
  unknown: 'default',
  trace: 'default',
};

const severityLabels: Record<NonNullable<GenericTemplateData['severity']>, string> = {
  critical: '🔴 CRITICAL',
  warning: '⚠️ WARNING',
  info: 'INFO',
  success: '✅ SUCCESS',
  error: '🔴 ERROR',
  debug: 'DEBUG',
  unknown: 'UNKNOWN',
  trace: 'TRACE',
};

export function summarizeGenericTemplate(data: GenericTemplateData): string {
  const title = data.source ? `${data.source}: ${data.title}` : data.title;

  return createActivitySummary([title, data.body]);
}

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
