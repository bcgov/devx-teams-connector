import { describe, expect, it } from 'vitest';

import { renderUptimeTemplate } from '../../src/templates/uptime';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderUptimeTemplate', () => {
  it('renders action button for each status', () => {
    for (const status of ['up', 'down'] as const) {
      const card = renderUptimeTemplate({
        status,
        service: 'payments-api',
        url: 'https://status.example.com/payments-api',
      });

      const items = getContentItems(card);
      const actionSet = items.find((item) => item.type === 'ActionSet');
      const actions = actionSet?.actions as Array<Record<string, unknown>>;
      expect(actions?.[0]).toEqual({
        type: 'Action.OpenUrl',
        title: 'Check Service',
        url: 'https://status.example.com/payments-api',
      });
    }
  });

  it('renders downSince in fact set when present', () => {
    const card = renderUptimeTemplate({
      status: 'down',
      service: 'payments-api',
      downSince: '2026-02-22T12:00:00Z',
    });

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === 'FactSet');
    const facts = factSetBlock?.facts as Array<Record<string, string>>;
    const downSince = facts.find((entry) => entry.title === 'Down since:');

    expect(downSince).toBeDefined();
  });

  it('omits fact set when optional values are missing', () => {
    const card = renderUptimeTemplate({
      status: 'up',
      service: 'payments-api',
    });

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === 'FactSet');
    expect(factSetBlock).toBeUndefined();
  });
});
