import { z } from 'zod';

import type { AdaptiveCard, GitHubPrTemplateData, GitHubWorkflowTemplateData } from '../types';
import { createBaseCard, createCardFrame, createFactSet, createSectionSeparator, truncateText } from './shared';

export const GitHubPrTemplateDataSchema = z.object({
  event: z.string().min(1), // action: "opened" | "closed"
  title: z.string().min(1).max(200), // pull_request.title
  repo: z.string().min(1), // repository.full_name
  author: z.string().min(1), // pull_request.user.login 
  url: z.string().url(), // pull_request.html_url
  body: z.string().optional(), // pull_request.body
});

export const GitHubWorkflowTemplateDataSchema = z.object({
});

const eventBadges: Record<GitHubPrTemplateData['event'], string> = {
  opened: 'Pull Request Opened',
  closed: 'Pull Request Closed',
};

const eventTextColors: Record<GitHubPrTemplateData['event'], 'Good' | 'Attention'> = {
  opened: 'Good',
  closed: 'Attention',
};

export function renderGitHubPrTemplate(data: GitHubPrTemplateData): AdaptiveCard {
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

  const body: Array<Record<string, unknown>> = [createCardFrame(contentItems)];

  return createBaseCard(body);
}

export function renderGitHubWorkflowTemplate(data: GitHubWorkflowTemplateData): AdaptiveCard {
  const contentItems: Array<Record<string, unknown>> = [
  ];

  const body: Array<Record<string, unknown>> = [createCardFrame(contentItems)];

  return createBaseCard(body);
}