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
  event: z.string().min(1), // action: "completed" | "requested" | "in_progress"
  conclusion: z.string().optional(), // workflow_run.conclusion: "success" | "failure" | "cancelled" | ...
  workflow: z.string().min(1).max(200), // workflow_run.name
  repo: z.string().min(1), // repository.full_name
  branch: z.string().min(1), // workflow_run.head_branch
  author: z.string().min(1), // workflow_run.triggering_actor.login
  url: z.string().url(), // workflow_run.html_url
  sha: z.string().min(1).optional(), // workflow_run.head_sha (short)
  message: z.string().optional(), // workflow_run.head_commit.message
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

type ConclusionLabel = 'success' | 'failure' | 'cancelled' | 'other';

function toConclusionLabel(conclusion: string | undefined): ConclusionLabel {
  if (conclusion === 'success') return 'success';
  if (conclusion === 'failure') return 'failure';
  if (conclusion === 'cancelled') return 'cancelled';
  return 'other';
}

const conclusionBadges: Record<ConclusionLabel, string> = {
  success: 'Workflow Succeeded',
  failure: 'Workflow Failed',
  cancelled: 'Workflow Cancelled',
  other: 'Workflow Run',
};

const conclusionTextColors: Record<ConclusionLabel, 'Good' | 'Attention' | 'Warning' | 'Default'> = {
  success: 'Good',
  failure: 'Attention',
  cancelled: 'Warning',
  other: 'Default',
};

export function renderGitHubWorkflowTemplate(data: GitHubWorkflowTemplateData): AdaptiveCard {
  const label = toConclusionLabel(data.conclusion);
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
      text: conclusionBadges[label],
      size: 'Small',
      color: conclusionTextColors[label],
      weight: 'Bolder',
      spacing: 'None',
    },
    {
      type: 'TextBlock',
      text: data.workflow,
      weight: 'Bolder',
      size: 'Large',
      wrap: true,
      spacing: 'Small',
    },
  ];

  if (data.message) {
    contentItems.push({
      type: 'TextBlock',
      text: truncateText(data.message, 300),
      wrap: true,
      size: 'Small',
      isSubtle: true,
      spacing: 'Small',
    });
  }

  const factSet = createFactSet([
    { title: 'Branch', value: data.branch },
    { title: 'Author', value: data.author },
    { title: 'Commit', value: data.sha },
  ]);
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