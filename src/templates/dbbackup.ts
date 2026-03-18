import { z } from 'zod';

import type { AdaptiveCard, DbBackupTemplateData } from '../types';
import { createBaseCard, createCardFrame, createFactSet, createSectionSeparator, toTextColor } from './shared';

export const DbBackupTemplateDataSchema = z.object({
  status: z.enum(['success', 'warning', 'failed']),
  database: z.string().min(1).max(200),
  duration: z.string().min(1).optional(),
  size: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  container: z.string().min(1).optional(),
}).strict();

const statusStyles: Record<DbBackupTemplateData['status'], 'good' | 'warning' | 'attention'> = {
  success: 'good',
  warning: 'warning',
  failed: 'attention',
};

const statusTitles: Record<DbBackupTemplateData['status'], string> = {
  success: 'Database Backup · Completed',
  warning: 'Database Backup · Warning',
  failed: 'Database Backup · Failed',
};

const statusFacts: Record<DbBackupTemplateData['status'], string> = {
  success: '✅ Success',
  warning: '⚠️ Warning',
  failed: '❌ Failed',
};

export function renderDbBackupTemplate(data: DbBackupTemplateData): AdaptiveCard {
  const contentItems: Array<Record<string, unknown>> = [
    {
      type: 'TextBlock',
      text: statusTitles[data.status],
      size: 'Small',
      color: toTextColor(statusStyles[data.status]),
      weight: 'Bolder',
      spacing: 'None',
    },
    {
      type: 'TextBlock',
      text: data.database,
      weight: 'Bolder',
      size: 'Large',
      wrap: true,
      spacing: 'Small',
    },
  ];

  if (data.message) {
    contentItems.push({
      type: 'Container',
      spacing: 'Small',
      items: [
        {
          type: 'TextBlock',
          text: data.message,
          wrap: true,
          size: 'Small',
          ...(data.status === 'failed' ? { color: 'Attention', weight: 'Bolder' } : { isSubtle: true }),
        },
      ],
    });
  }

  const factSet = createFactSet([
    { title: 'Status', value: statusFacts[data.status] },
    { title: 'Duration', value: data.duration },
    { title: 'Size', value: data.size },
    { title: 'Container', value: data.container },
  ]);

  if (factSet) {
    contentItems.push(createSectionSeparator());
    contentItems.push(factSet);
  }

  const body: Array<Record<string, unknown>> = [createCardFrame(contentItems)];

  return createBaseCard(body);
}
