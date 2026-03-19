import { z } from 'zod';

import type { AdaptiveCard, UptimeTemplateData } from '../types';
import {
  IsoTimestampSchema,
  createBaseCard,
  createCardFrame,
  createFactSet,
  createSectionSeparator,
  formatRelativeTimeOrIso,
} from './shared';

export const UptimeTemplateDataSchema = z.object({
  status: z.enum(['up', 'down']), // data.alert.is_up
  service: z.string().min(1), // data.service.display_name
  downSince: IsoTimestampSchema.optional(), // data.alert.created_at
  url: z.string().url().optional(), // data.links.alert_details
});

const statusBadges: Record<UptimeTemplateData['status'], string> = {
  up: '🟢 UP',
  down: '🔴 DOWN',
};

function toHostname(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

export function renderUptimeTemplate(data: UptimeTemplateData): AdaptiveCard {
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
              color: data.status === 'up' ? 'Good' : data.status === 'degraded' ? 'Warning' : 'Attention',
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
              text: 'Uptime Monitor',
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
      title: 'Response',
      value: typeof data.responseTimeMs === 'number' ? `${data.responseTimeMs}ms` : data.status === 'down' ? '⏱ Timeout' : undefined,
    },
    {
      title: 'Down since',
      value: data.downSince ? formatRelativeTimeOrIso(data.downSince) : undefined,
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
          title: 'Check Service',
          url: data.url,
        },
      ],
    });
  }

  const body: Array<Record<string, unknown>> = [createCardFrame(contentItems)];

  return createBaseCard(body);
}
