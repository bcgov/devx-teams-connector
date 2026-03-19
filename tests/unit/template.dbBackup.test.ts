import { describe, expect, it } from 'vitest';

import { renderDbBackupTemplate } from '../../src/templates/dbbackup';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderDbBackupTemplate', () => {
  it('does not set card-level actions for any status', () => {
    for (const status of ['info', 'warn', 'error'] as const) {
      const card = renderDbBackupTemplate({
        status,
        projectName: 'abc123',
        ProjectFriendlyName: 'My Project',
      });

      expect(card.actions).toBeUndefined();
    }
  });

  it('renders status and project facts when provided', () => {
    const card = renderDbBackupTemplate({
      status: 'warn',
      projectName: 'abc123',
      ProjectFriendlyName: 'My Project',
      message: 'Completed with retries',
    });

    const items = getContentItems(card);

    const messageContainer = items.find((item) => item.type === 'Container');
    expect(messageContainer).toBeDefined();

    const factSetBlock = items.find((item) => item.type === 'FactSet');
    const facts = factSetBlock?.facts as Array<Record<string, string>>;

    expect(facts).toEqual([
      { title: 'Status:', value: '⚠️ Warning' },
      { title: 'Project:', value: 'abc123' },
    ]);
  });
});
