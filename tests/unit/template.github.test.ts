import { describe, expect, it } from 'vitest';

import { renderGitHubTemplate } from '../../src/templates/github';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderGitHubTemplate', () => {
  it('renders action button for each event type', () => {
    for (const event of ['merged', 'opened', 'closed'] as const) {
      const card = renderGitHubTemplate({
        event,
        title: 'PR #123',
        repo: 'org/repo',
        author: 'octocat',
        url: 'https://github.com/org/repo/pull/123',
      });

      const items = getContentItems(card);
      const actionSet = items.find((item) => item.type === 'ActionSet');
      const actions = actionSet?.actions as Array<Record<string, unknown>>;
      expect(actions?.[0]).toEqual({
        type: 'Action.OpenUrl',
        title: 'View on GitHub',
        url: 'https://github.com/org/repo/pull/123',
      });
    }
  });

  it('truncates body text to 300 chars with deterministic ellipsis', () => {
    const card = renderGitHubTemplate({
      event: 'opened',
      title: 'PR #123',
      repo: 'org/repo',
      author: 'octocat',
      url: 'https://github.com/org/repo/pull/123',
      body: 'x'.repeat(350),
    });

    const contentItems = getContentItems(card);

    // Find the body text block (subtle, small text after the title)
    const bodyTextBlock = contentItems.find(
      (item) => item.isSubtle === true && item.type === 'TextBlock' && typeof item.text === 'string' && (item.text as string).length > 50,
    );
    expect(bodyTextBlock).toBeDefined();
    expect((bodyTextBlock?.text as string).length).toBe(300);
    expect(bodyTextBlock?.text).toBe(`${'x'.repeat(297)}...`);

    // Find the fact set inside the header
    const factSetBlock = contentItems.find((item) => item.type === 'FactSet');
    const facts = factSetBlock?.facts as Array<Record<string, string>>;
    expect(facts).toEqual([{ title: 'Author:', value: 'octocat' }]);
  });
});
