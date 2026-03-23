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

const eventBadges: Record<string, string> = {
  opened: 'Pull Request Opened',
  closed: 'Pull Request Closed',
  reopened: 'Pull Request Reopened',
  synchronize: 'Pull Request Updated',
  ready_for_review: 'Pull Request Ready for Review',
  converted_to_draft: 'Converted to Draft',
  review_requested: 'Review Requested',
};

const eventTextColors: Record<string, 'Good' | 'Attention' | 'Default'> = {
  opened: 'Good',
  closed: 'Attention',
  reopened: 'Good',
};

function formatEventBadge(event: string): string {
  return `Pull Request ${event.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`;
}

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
      text: eventBadges[data.event] ?? formatEventBadge(data.event),
      size: 'Small',
      color: eventTextColors[data.event] ?? 'Default',
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

type WorkflowLabel = 'success' | 'failure' | 'cancelled' | 'action_required' | 'in_progress' | 'queued' | 'other';

function toWorkflowLabel(conclusion: string | undefined, event: string): WorkflowLabel {
  if (conclusion) {
    if (conclusion === 'success') return 'success';
    if (conclusion === 'failure' || conclusion === 'timed_out') return 'failure';
    if (conclusion === 'cancelled') return 'cancelled';
    if (conclusion === 'action_required') return 'action_required';
    return 'other';
  }
  if (event === 'in_progress') return 'in_progress';
  if (event === 'requested') return 'queued';
  return 'other';
}

const workflowBadges: Record<WorkflowLabel, string> = {
  success: 'Workflow Succeeded',
  failure: 'Workflow Failed',
  cancelled: 'Workflow Cancelled',
  action_required: 'Workflow Action Required',
  in_progress: 'Workflow In Progress',
  queued: 'Workflow Queued',
  other: 'Workflow Run',
};

const workflowTextColors: Record<WorkflowLabel, 'Good' | 'Attention' | 'Warning' | 'Default'> = {
  success: 'Good',
  failure: 'Attention',
  cancelled: 'Warning',
  action_required: 'Warning',
  in_progress: 'Default',
  queued: 'Default',
  other: 'Default',
};

export function renderGitHubWorkflowTemplate(data: GitHubWorkflowTemplateData): AdaptiveCard {
  const label = toWorkflowLabel(data.conclusion, data.event);
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
      text: workflowBadges[label],
      size: 'Small',
      color: workflowTextColors[label],
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