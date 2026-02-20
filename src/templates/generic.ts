import { z } from 'zod';

import type { AdaptiveCard, GenericTemplateData } from '../types';

const GenericSeveritySchema = z.enum(['critical', 'warning', 'info', 'success']).default('info');

export const GenericTemplateDataSchema = z.object({
  title: z.string().min(1),
  body: z.string().max(2000).optional(),
  severity: GenericSeveritySchema.optional(),
  url: z.string().url().optional(),
  urlLabel: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
});

const severityStyles: Record<NonNullable<GenericTemplateData['severity']>, string> = {
  critical: 'attention',
  warning: 'warning',
  info: 'accent',
  success: 'good',
};

export function renderGenericTemplate(input: unknown): AdaptiveCard {
  const data = GenericTemplateDataSchema.parse(input);
  const severity = data.severity ?? 'info';
  const severityStyle = severityStyles[severity];

  const containerItems: Array<Record<string, unknown>> = [
    {
      type: 'TextBlock',
      text: data.title,
      weight: 'Bolder',
      wrap: true,
      size: 'Medium',
    },
  ];

  if (data.body) {
    containerItems.push({
      type: 'TextBlock',
      text: data.body,
      wrap: true,
    });
  }

  if (data.source) {
    containerItems.push({
      type: 'TextBlock',
      text: data.source,
      isSubtle: true,
      spacing: 'Small',
      wrap: true,
    });
  }

  const body: Array<Record<string, unknown>> = [
    {
      type: 'Container',
      style: severityStyle,
      bleed: true,
      items: containerItems,
    },
  ];

  const actions: Array<Record<string, unknown>> = [];

  if (data.url) {
    actions.push({
      type: 'Action.OpenUrl',
      title: data.urlLabel ?? 'View Details',
      url: data.url,
    });
  }

  const card: AdaptiveCard = {
    type: 'AdaptiveCard',
    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body,
  };

  if (actions.length > 0) {
    card.actions = actions;
  }

  return card;
}
