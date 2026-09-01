import { z } from 'zod';

import type { AdaptiveCard, ErrorTemplateData } from '../types';
import {
  boundedString,
  createActivitySummary,
  createBaseCard,
  createCardFrame,
  createSectionSeparator,
  optionalBoundedString,
  optionalField,
} from './shared';


function hasBody(data: ErrorTemplateData): boolean {
  return Boolean(data.message || data.stack || data.url);
}

export const ErrorTemplateDataSchema = z.object({
  workflowName: boundedString(2000),
  message: optionalBoundedString(2000),
  stack: optionalBoundedString(2000),
  url: optionalField(z.string().url()),
  executionId: optionalField(z.string()),
});


export function summarizeErrorTemplate(data: ErrorTemplateData): string {
  const title = `Error in workflow: ${data.workflowName}`;
  const message = data.message ? `Message: ${data.message}` : undefined;
  
  return createActivitySummary([title, message].filter(Boolean));
}

export function renderErrorTemplate(data: ErrorTemplateData): AdaptiveCard {
  const contentItems: Array<Record<string, unknown>> = [];

  contentItems.push({
    type: 'TextBlock',
    text: `❌ ERROR in n8n workflow`,
    weight: 'Bolder',
    size: 'Large',
  });

  contentItems.push({
    type: 'TextBlock',
    text: `Workflow: ${data.workflowName}`,
    weight: 'Bolder',
    size: 'Medium',
    spacing: 'Small',
    wrap: true,
  });

  if (data.executionId) {
    contentItems.push({
      type: 'TextBlock',
      text: `Execution ID: ${data.executionId}`,
      weight: 'Bolder',
      size: 'Small',
      spacing: 'Small',
    });
  }

  if (hasBody(data)) {
    contentItems.push(createSectionSeparator());

    if (data.message) {
      contentItems.push({
        type: 'TextBlock',
        text: `Message: ${data.message}`,
        size: 'Medium',
        spacing: 'Small',
        wrap: true,
      });
    }

    if (data.stack) {
      contentItems.push({
        type: 'TextBlock',
        text: `Stack trace: ${data.stack}`,
        wrap: true,
        size: 'Small',
        spacing: 'Medium',
      });
    }

    if (data.url) {
      contentItems.push({
        type: 'ActionSet',
        spacing: 'Medium',
        actions: [
          {
            type: 'Action.OpenUrl',
            title: 'View Error Details',
            url: data.url,
          },
        ],
      });
    }
  }


  const body: Array<Record<string, unknown>> = [createCardFrame(contentItems)];

  return createBaseCard(body);
} 


