import { describe, expect, it } from 'vitest';

import {
  ErrorTemplateDataSchema,
  renderErrorTemplate,
  summarizeErrorTemplate,
} from '../../src/templates/error';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderErrorTemplate', () => {
  it('renders expected core error card structure', () => {
    const card = renderErrorTemplate({
      workflowName: 'Team Alpha - GitHub PR Workflow',
      message: 'invalid JSON payload received',
      executionId: 'exec-42',
      url: 'https://example.com/errors/42',
    });

    expect(card.type).toBe('AdaptiveCard');
    expect(card.body.length).toBeGreaterThan(0);

    const items = getContentItems(card);
    expect(items[0]).toMatchObject({
      type: 'TextBlock',
      text: '❌ ERROR in n8n workflow',
      weight: 'Bolder',
      size: 'Large',
    });
    expect(items[1]).toMatchObject({
      type: 'TextBlock',
      text: 'Workflow: Team Alpha - GitHub PR Workflow',
      weight: 'Bolder',
      size: 'Medium',
    });

    const executionItem = items.find(
      (item) => item.type === 'TextBlock' && item.text === 'Execution ID: exec-42',
    );
    expect(executionItem).toBeDefined();

    const messageItem = items.find(
      (item) => item.type === 'TextBlock' && String(item.text).startsWith('Message: invalid JSON payload received'),
    );
    expect(messageItem).toBeDefined();

    const actionSet = items.find((item) => item.type === 'ActionSet');
    const actions = actionSet?.actions as Array<Record<string, unknown>>;
    expect(actions?.[0]).toEqual({
      type: 'Action.OpenUrl',
      title: 'View Error Details',
      url: 'https://example.com/errors/42',
    });
  });

  it('includes message and stack details when provided', () => {
    const card = renderErrorTemplate({
      workflowName: 'Daily sync',
      message: 'Retry limit exceeded',
      stack: 'Error: Request failed\n    at processTicksAndRejections',
    });

    const items = getContentItems(card);
    expect(items.some((item) => item.type === 'TextBlock' && item.text === 'Message: Retry limit exceeded')).toBe(true);
    expect(items.some((item) => item.type === 'TextBlock' && String(item.text).startsWith('Stack trace: Error: Request failed'))).toBe(true);
  });

  it('omits optional fields when they are not provided', () => {
    const card = renderErrorTemplate({ workflowName: 'Cleanup job' });
    const items = getContentItems(card);

    expect(items).toHaveLength(2);
    expect(items.every((item) => typeof item.type === 'string')).toBe(true);
    expect(items.some((item) => item.type === 'TextBlock' && String(item.text).includes('Workflow: Cleanup job'))).toBe(true);
    expect(items.some((item) => item.type === 'TextBlock' && String(item.text).includes('❌ ERROR in n8n workflow'))).toBe(true);
  });

  it('accepts valid schema values and trims overly long strings', () => {
    const parsed = ErrorTemplateDataSchema.parse({
      workflowName: 'a'.repeat(3000),
      message: 'b'.repeat(3000),
      stack: 'c'.repeat(3000),
      url: 'https://example.com/errors/7',
      executionId: 'exec-7',
    });

    expect(parsed.workflowName.length).toBeLessThanOrEqual(2000);
    expect(parsed.message).toBeDefined();
    expect(parsed.message!.length).toBeLessThanOrEqual(2000);
    expect(parsed.stack).toBeDefined();
    expect(parsed.stack!.length).toBeLessThanOrEqual(2000);
    expect(parsed.url).toBe('https://example.com/errors/7');
    expect(parsed.executionId).toBe('exec-7');
  });

  it('sanitizes blank optional strings to undefined', () => {
    const parsed = ErrorTemplateDataSchema.parse({
      workflowName: 'Cleanup job',
      message: '   ',
      stack: '',
      url: '   ',
      executionId: '',
    });

    expect(parsed.message).toBeUndefined();
    expect(parsed.stack).toBeUndefined();
    expect(parsed.url).toBeUndefined();
    expect(parsed.executionId).toBeUndefined();
  });
});

describe('summarizeErrorTemplate', () => {
  it('creates a compact summary with workflow and message', () => {
    const summary = summarizeErrorTemplate({
      workflowName: 'Uptime status check',
      message: 'Invalid syntax',
    });

    expect(summary).toContain('Error in workflow: Uptime status check');
    expect(summary).toContain('Invalid syntax');
  });

  it('truncates the summary when it exceeds the maximum length', () => {
    const summary = summarizeErrorTemplate({
      workflowName: 'Job for test',
      message: 'x'.repeat(500),
    });

    expect(summary.length).toBeLessThanOrEqual(250);
    expect(summary.endsWith('…')).toBe(true);
  });
});
       