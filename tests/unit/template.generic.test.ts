import { describe, expect, it } from 'vitest';

import { renderGenericTemplate } from '../../src/templates/generic';

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
    expect(card.actions).toBeDefined();
    expect(card.actions?.[0]).toEqual({
      type: 'Action.OpenUrl',
      title: 'View Status',
      url: 'https://status.example.com',
    });
  });

  it('uses documented severity color mapping', () => {
    const styles = {
      critical: 'attention',
      warning: 'warning',
      info: 'accent',
      success: 'good',
    } as const;

    for (const [severity, expectedStyle] of Object.entries(styles)) {
      const card = renderGenericTemplate({ title: 'x', severity });
      const container = card.body[0];
      expect(container.style).toBe(expectedStyle);
    }
  });

  it('defaults url label and severity when omitted', () => {
    const card = renderGenericTemplate({
      title: 'Heads up',
      url: 'https://example.com',
    });

    expect(card.actions?.[0]).toEqual({
      type: 'Action.OpenUrl',
      title: 'View Details',
      url: 'https://example.com',
    });
    expect(card.body[0].style).toBe('accent');
  });
});
