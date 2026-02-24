import { z } from 'zod';

import type { AdaptiveCard, GitHubTemplateData } from '../types';
import { createBaseCard, createCardFrame, createFactSet, createSectionSeparator, truncateText } from './shared';

export const GitHubTemplateDataSchema = z.object({
  event: z.enum(['opened', 'merged', 'closed']),
  title: z.string().min(1),
  repo: z.string().min(1),
  author: z.string().min(1),
  url: z.string().url(),
  body: z.string().optional(),
}).strict();

const eventStyles: Record<GitHubTemplateData['event'], 'accent' | 'good' | 'attention'> = {
  merged: 'accent',
  opened: 'good',
  closed: 'attention',
};

const eventBadges: Record<GitHubTemplateData['event'], string> = {
  opened: 'Pull Request Opened',
  merged: 'Pull Request Merged',
  closed: 'Pull Request Closed',
};

const eventTextColors: Record<GitHubTemplateData['event'], 'Good' | 'Accent' | 'Attention'> = {
  opened: 'Good',
  merged: 'Accent',
  closed: 'Attention',
};

export function renderGitHubTemplate(data: GitHubTemplateData): AdaptiveCard {
  const contentItems: Array<Record<string, unknown>> = [
    {
      type: 'TextBlock',
      text: data.repo,
      size: 'Small',
      isSubtle: true,
      spacing: 'None',
    },
    {
      type: 'TextBlock',
      text: eventBadges[data.event],
      size: 'Small',
      color: eventTextColors[data.event],
      weight: 'Bolder',
      spacing: 'None',
    },
    {
      type: 'TextBlock',
      text: data.title,
      weight: 'Bolder',
      size: 'Large',
      wrap: true,
      spacing: 'Small',
    },
  ];

  if (data.body) {
    contentItems.push({
      type: 'TextBlock',
      text: truncateText(data.body, 300),
      wrap: true,
      size: 'Small',
      isSubtle: true,
      spacing: 'Small',
    });
  }

  const factSet = createFactSet([{ title: 'Author', value: data.author }]);
  if (factSet) {
    contentItems.push(createSectionSeparator());
    contentItems.push(factSet);
  }

  contentItems.push({
    type: 'ActionSet',
    spacing: 'Medium',
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'View on GitHub',
        url: data.url,
      },
    ],
  });

  const body: Array<Record<string, unknown>> = [
    createCardFrame(eventStyles[data.event], contentItems),
  ];

  return createBaseCard(body);
}
