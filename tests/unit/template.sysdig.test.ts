import { describe, expect, it, vi } from 'vitest';

import { renderSysdigTemplate } from '../../src/templates/sysdig';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderSysdigTemplate', () => {
  it('maps each severity to the correct alert color', () => {
    const expectedColors: Array<[number, string]> = [
      [0, 'Attention'],  // critical
      [1, 'Warning'],    // high
      [2, 'Warning'],    // medium
      [4, 'Accent'],     // low
      [6, 'Default'],    // info
    ];

    for (const [severity, expectedColor] of expectedColors) {
      const card = renderSysdigTemplate({
        severity,
        alertName: 'Test alert',
      });

      const items = getContentItems(card);
      const columnSet = items.find((item) => item.type === 'ColumnSet') as Record<string, unknown>;
      const columns = columnSet?.columns as Array<Record<string, unknown>>;
      const firstColItems = columns[0]?.items as Array<Record<string, unknown>>;

      expect(firstColItems[0]?.color).toBe(expectedColor);
    }
  });

  it('renders action button for each severity level', () => {
    for (const severity of [0, 1, 2, 4, 6]) {
      const card = renderSysdigTemplate({
        severity,
        alertName: 'CPU saturation',
        url: 'https://app.sysdig.com/#/alerts',
      });

      const items = getContentItems(card);
      const actionSet = items.find((item) => item.type === 'ActionSet');
      const actions = actionSet?.actions as Array<Record<string, unknown>>;
      expect(actions?.[0]).toEqual({
        type: 'Action.OpenUrl',
        title: 'View in Sysdig',
        url: 'https://app.sysdig.com/#/alerts',
      });
    }
  });

  it('formats valid timestamp as relative time when possible', () => {
    const card = renderSysdigTemplate({
      severity: 1,
      alertName: 'CPU saturation',
      timestamp: new Date(Date.now() - 2 * 60_000).toISOString(),
    });

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === 'FactSet');
    const facts = factSetBlock?.facts as Array<Record<string, string>>;
    const timestampFact = facts.find((entry) => entry.title === 'Fired at:');

    expect(timestampFact).toBeDefined();
    expect(timestampFact?.value).toMatch(/ago|in|now/);
  });

  it('falls back to ISO when relative formatter throws', () => {
    const timestamp = '2026-02-22T12:00:00Z';
    const formatSpy = vi
      .spyOn(Intl.RelativeTimeFormat.prototype, 'format')
      .mockImplementation(() => {
        throw new Error('boom');
      });

    const card = renderSysdigTemplate({
      severity: 1,
      alertName: 'CPU saturation',
      timestamp,
    });

    formatSpy.mockRestore();

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === 'FactSet');
    const facts = factSetBlock?.facts as Array<Record<string, string>>;
    const timestampFact = facts.find((entry) => entry.title === 'Fired at:');

    expect(timestampFact?.value).toBe('2026-02-22T12:00:00.000Z');
  });
});
