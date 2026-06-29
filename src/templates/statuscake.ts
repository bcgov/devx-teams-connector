import { z } from 'zod';

import type { AdaptiveCard, StatusCakeTemplateData } from '../types';
import {
  IsoTimestampSchema,
  createActivitySummary,
  createBaseCard,
  createCardFrame,
  createFactSet,
  createSectionSeparator,
  formatRelativeTimeOrIso,
} from './shared';

// https://www.statuscake.com/kb/knowledge-base/how-to-use-the-web-hook-url/
export const StatusCakeTemplateDataSchema = z.object({
  status: z.enum(['up', 'down']), // POST['Status']
  testName: z.string().min(1), // POST['Name']
  websiteUrl: z.string().url().optional(), // POST['URL']
  statusCode: z.string().optional(), // POST['StatusCode']
  ip: z.string().optional(), // POST['IP']
  tags: z.string().optional(), // POST['Tags']
  checkRate: z.string().optional(), // POST['Checkrate']
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

export function summarizeStatusCakeTemplate(data: StatusCakeTemplateData): string {
  return createActivitySummary([`${data.testName} is ${data.status.toUpperCase()}`]);
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
      text: data.testName,
      weight: 'Bolder',
      size: 'Large',
      wrap: true,
      spacing: 'Small',
    },
  ];

  const factSet = createFactSet([
    { title: 'Website', value: toHostname(data.websiteUrl) },
    {
      title: 'Alert time',
      value: data.alertAt ? formatRelativeTimeOrIso(data.alertAt) : undefined,
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

  const actionUrl = data.alertUrl ?? data.websiteUrl;

  if (actionUrl) {
    contentItems.push({
      type: 'ActionSet',
      spacing: 'Medium',
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'Open StatusCake Alert',
          url: actionUrl,
        },
      ],
    });
  }

  return createBaseCard([createCardFrame(contentItems)]);
}