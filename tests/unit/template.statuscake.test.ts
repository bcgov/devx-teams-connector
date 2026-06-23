import { describe, expect, it } from 'vitest';

import { renderStatusCakeTemplate } from '../../src/templates/statuscake';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderStatusCakeTemplate', () => {
  it('renders StatusCake action button for each status', () => {
    for (const status of ['up', 'down'] as const) {
      const card = renderStatusCakeTemplate({
        status,
        service: 'payments-api',
        url: 'https://status.example.com/payments-api',
      });

      const items = getContentItems(card);
      const actionSet = items.find((item) => item.type === 'ActionSet');
      const actions = actionSet?.actions as Array<Record<string, unknown>>;

      expect(actions?.[0]).toEqual({
        type: 'Action.OpenUrl',
        title: 'Open StatusCake Alert',
        url: 'https://status.example.com/payments-api',
      });
    }
  });

  it('renders StatusCake-specific fields in fact set', () => {
    const card = renderStatusCakeTemplate({
      status: 'down',
      service: 'payments-api',
      downSince: '2026-02-22T12:00:00Z',
      url: 'https://status.example.com/payments-api',
      checkRate: '5 minutes',
      trigger: 'HTTP status != 200',
      region: 'Vancouver',
      message: 'Endpoint failed health check',
    });

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === 'FactSet');
    const facts = factSetBlock?.facts as Array<Record<string, string>>;

    expect(facts.find((entry) => entry.title === 'Down since:')).toBeDefined();
    expect(facts).toContainEqual({ title: 'URL:', value: 'status.example.com' });
    expect(facts).toContainEqual({ title: 'Check rate:', value: '5 minutes' });
    expect(facts).toContainEqual({ title: 'Trigger:', value: 'HTTP status != 200' });
    expect(facts).toContainEqual({ title: 'Region:', value: 'Vancouver' });
    expect(facts).toContainEqual({ title: 'Message:', value: 'Endpoint failed health check' });
  });

  it('omits fact set when optional values are missing', () => {
    const card = renderStatusCakeTemplate({
      status: 'up',
      service: 'payments-api',
    });

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === 'FactSet');

    expect(factSetBlock).toBeUndefined();
  });
});