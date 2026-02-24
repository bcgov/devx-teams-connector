import { describe, expect, it } from 'vitest';

import { renderGenericTemplate } from '../../src/templates/generic';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderGenericTemplate', () => {
  it('renders expected core card structure', () => {
    const card = renderGenericTemplate({
      title: 'Scheduled Maintenance',
      body: 'Window starts in 30 minutes.',
      severity: 'warning',
      source: 'scheduler',
      url: 'https://status.example.com',
      urlLabel: 'View Status',
    });

    expect(card.type).toBe('AdaptiveCard');
    expect(card.version).toBe('1.4');
    expect(card.body.length).toBeGreaterThan(0);

    const items = getContentItems(card);
    const actionSet = items.find((item) => item.type === 'ActionSet');
    const actions = actionSet?.actions as Array<Record<string, unknown>>;
    expect(actions?.[0]).toEqual({
      type: 'Action.OpenUrl',
      title: 'View Status',
      url: 'https://status.example.com',
    });
  });

  it('renders card for each severity level', () => {
    for (const severity of ['critical', 'warning', 'info', 'success'] as const) {
      const card = renderGenericTemplate({ title: 'x', severity });
      expect(card.type).toBe('AdaptiveCard');
      expect(card.body.length).toBeGreaterThan(0);
    }
  });

  it('defaults url label and severity when omitted', () => {
    const card = renderGenericTemplate({
      title: 'Heads up',
      url: 'https://example.com',
    });

    const items = getContentItems(card);
    const actionSet = items.find((item) => item.type === 'ActionSet');
    const actions = actionSet?.actions as Array<Record<string, unknown>>;
    expect(actions?.[0]).toEqual({
      type: 'Action.OpenUrl',
      title: 'View Details',
      url: 'https://example.com',
    });
    expect(card.type).toBe('AdaptiveCard');
  });
});
