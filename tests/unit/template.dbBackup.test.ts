import { describe, expect, it } from 'vitest';

import { renderDbBackupTemplate } from '../../src/templates/dbbackup';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderDbBackupTemplate', () => {
  it('does not set card-level actions for any status', () => {
    for (const status of ['success', 'warning', 'failed'] as const) {
      const card = renderDbBackupTemplate({
        status,
        database: 'users',
      });

      expect(card.actions).toBeUndefined();
    }
  });

  it('renders status, duration, size, and container facts when provided', () => {
    const card = renderDbBackupTemplate({
      status: 'warning',
      database: 'users',
      duration: '2m 03s',
      size: '1.2 GB',
      message: 'Completed with retries',
      container: 'backup-job-1',
    });

    const items = getContentItems(card);

    const messageContainer = items.find((item) => item.type === 'Container');
    expect(messageContainer).toBeDefined();

    const factSetBlock = items.find((item) => item.type === 'FactSet');
    const facts = factSetBlock?.facts as Array<Record<string, string>>;

    expect(facts).toEqual([
      { title: 'Status:', value: '⚠️ Warning' },
      { title: 'Duration:', value: '2m 03s' },
      { title: 'Size:', value: '1.2 GB' },
      { title: 'Container:', value: 'backup-job-1' },
    ]);
  });
});
