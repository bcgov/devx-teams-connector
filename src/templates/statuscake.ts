import { z } from 'zod';

import type { AdaptiveCard, StatusCakeTemplateData } from '../types';
import {
  IsoTimestampSchema,
  createBaseCard,
  createCardFrame,
  createFactSet,
  createSectionSeparator,
  formatRelativeTimeOrIso,
} from './shared';

export const StatusCakeTemplateDataSchema = z.object({
  status: z.enum(['up', 'down']),
  service: z.string().min(1),
  downSince: IsoTimestampSchema.optional(),
  url: z.string().url().optional(),
  checkRate: z.string().optional(),
  trigger: z.string().optional(),
  region: z.string().optional(),
  message: z.string().optional(),
});

const statusBadges: Record<StatusCakeTemplateData['status'], string> = {
  up: '🟢 UP',
  down: '🔴 DOWN',
};

function toHostname(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

export function renderStatusCakeTemplate(data: StatusCakeTemplateData): AdaptiveCard {
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
              text: statusBadges[data.status],
              size: 'Small',
              color: data.status === 'up' ? 'Good' : 'Attention',
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
              text: 'StatusCake',
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
      text: data.service,
      weight: 'Bolder',
      size: 'Large',
      wrap: true,
      spacing: 'Small',
    },
  ];

  const factSet = createFactSet([
    { title: 'URL', value: toHostname(data.url) },
    {
      title: 'Down since',
      value: data.downSince ? formatRelativeTimeOrIso(data.downSince) : undefined,
    },
    { title: 'Check rate', value: data.checkRate },
    { title: 'Trigger', value: data.trigger },
    { title: 'Region', value: data.region },
    { title: 'Message', value: data.message },
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
          title: 'Open StatusCake Alert',
          url: data.url,
        },
      ],
    });
  }

  return createBaseCard([createCardFrame(contentItems)]);
}