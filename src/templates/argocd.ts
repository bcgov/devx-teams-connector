import { z } from 'zod';

import type { AdaptiveCard, ArgoCdTemplateData } from '../types';
import {
  IsoTimestampSchema,
  createBaseCard,
  createCardFrame,
  createFactSet,
  createSectionSeparator,
  formatRelativeTimeOrIso,
  toTextColor,
} from './shared';

export const ArgoCdTemplateDataSchema = z.object({
  event: z.enum(['sync_succeeded', 'sync_failed', 'out_of_sync']),
  application: z.string().min(1).max(200),
  syncStatus: z.enum(['Synced', 'OutOfSync', 'Unknown']).optional(),
  healthStatus: z.enum(['Healthy', 'Degraded', 'Progressing', 'Missing', 'Suspended', 'Unknown']).optional(),
  revision: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  target: z.string().min(1).optional(),
  timestamp: IsoTimestampSchema.optional(),
  message: z.string().min(1).optional(),
  url: z.string().url().optional(),
}).strict();

const eventStyles: Record<ArgoCdTemplateData['event'], 'good' | 'warning' | 'attention'> = {
  sync_succeeded: 'good',
  sync_failed: 'attention',
  out_of_sync: 'warning',
};

const eventBadges: Record<ArgoCdTemplateData['event'], string> = {
  sync_succeeded: 'ArgoCD · Sync Succeeded',
  sync_failed: 'ArgoCD · Sync Failed',
  out_of_sync: 'ArgoCD · Drift Detected',
};

const defaultSyncStatuses: Record<ArgoCdTemplateData['event'], string> = {
  sync_succeeded: 'Synced',
  sync_failed: 'OutOfSync',
  out_of_sync: 'OutOfSync',
};

const defaultHealthStatuses: Partial<Record<ArgoCdTemplateData['event'], string>> = {
  sync_succeeded: 'Healthy',
  sync_failed: 'Degraded',
};

const syncStatusLabels: Record<string, string> = {
  Synced: '✅ Synced',
  OutOfSync: '⚠️ OutOfSync',
  Unknown: '❓ Unknown',
};

const syncStatusColors: Record<string, string> = {
  Synced: 'Good',
  OutOfSync: 'Warning',
  Unknown: 'Default',
};

const healthStatusLabels: Record<string, string> = {
  Healthy: '💚 Healthy',
  Degraded: '🔴 Degraded',
  Progressing: '🔄 Progressing',
  Missing: '❓ Missing',
  Suspended: '❓ Suspended',
  Unknown: '❓ Unknown',
};

const healthStatusColors: Record<string, string> = {
  Healthy: 'Good',
  Degraded: 'Attention',
  Progressing: 'Accent',
  Missing: 'Warning',
  Suspended: 'Warning',
  Unknown: 'Default',
};

function createStatusPills(sync: string | undefined, health: string | undefined): Record<string, unknown> {
  const columns: Array<Record<string, unknown>> = [];

  if (sync) {
    columns.push({
      type: 'Column',
      width: 'auto',
      items: [{
        type: 'TextBlock',
        text: syncStatusLabels[sync] ?? sync,
        size: 'Small',
        color: syncStatusColors[sync] ?? 'Default',
        weight: 'Bolder',
      }],
    });
  }

  if (health) {
    columns.push({
      type: 'Column',
      width: 'auto',
      items: [{
        type: 'TextBlock',
        text: healthStatusLabels[health] ?? health,
        size: 'Small',
        color: healthStatusColors[health] ?? 'Default',
        weight: 'Bolder',
      }],
    });
  }

  return {
    type: 'ColumnSet',
    spacing: 'Small',
    columns,
  };
}

export function renderArgoCdTemplate(data: ArgoCdTemplateData): AdaptiveCard {
  const contentItems: Array<Record<string, unknown>> = [
    {
      type: 'TextBlock',
      text: eventBadges[data.event],
      size: 'Small',
      color: toTextColor(eventStyles[data.event]),
      weight: 'Bolder',
      spacing: 'None',
    },
    {
      type: 'TextBlock',
      text: data.application,
      weight: 'Bolder',
      size: 'Large',
      wrap: true,
      spacing: 'Small',
    },
  ];

  const sync = data.syncStatus ?? defaultSyncStatuses[data.event];
  const health = data.healthStatus ?? defaultHealthStatuses[data.event];

  if (sync || health) {
    contentItems.push(createStatusPills(sync, health));
  }

  if (data.message) {
    contentItems.push(createSectionSeparator());

    contentItems.push({
      type: 'Container',
      style: 'default',
      spacing: 'Medium',
      items: [
        {
          type: 'TextBlock',
          text: data.message,
          wrap: true,
          size: 'Default',
          weight: 'Bolder',
        },
      ],
    });
  }

  const factSet = createFactSet([
    {
      title: 'Revision',
      value: data.revision,
    },
    {
      title: 'Project',
      value: data.project,
    },
    {
      title: 'Target',
      value: data.target,
    },
    {
      title: data.event === 'sync_succeeded' ? 'Synced at' : data.event === 'sync_failed' ? 'Failed at' : 'Detected',
      value: data.timestamp ? formatRelativeTimeOrIso(data.timestamp) : undefined,
    },
  ]);

  if (factSet) {
    if (!data.message) {
      contentItems.push(createSectionSeparator());
    }
    contentItems.push(factSet);
  }

  if (data.url) {
    contentItems.push({
      type: 'ActionSet',
      spacing: 'Medium',
      actions: [
        {
          type: 'Action.OpenUrl',
          title: data.event === 'out_of_sync' ? 'View Diff in ArgoCD' : 'View in ArgoCD',
          url: data.url,
        },
      ],
    });
  }

  const body: Array<Record<string, unknown>> = [createCardFrame(contentItems)];

  return createBaseCard(body);
}
