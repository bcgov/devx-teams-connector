import { describe, expect, it } from 'vitest';

import { renderGitHubPrTemplate, renderGitHubWorkflowTemplate } from '../../src/templates/github';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderGitHubPrTemplate', () => {
  it('renders action button for each event type', () => {
    for (const event of ['opened', 'closed'] as const) {
      const card = renderGitHubPrTemplate({
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
    const card = renderGitHubPrTemplate({
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

describe('renderGitHubWorkflowTemplate', () => {
  it('renders correct badge color for each conclusion', () => {
    const expectedColors: Array<[string, string]> = [
      ['success', 'Good'],
      ['failure', 'Attention'],
      ['cancelled', 'Warning'],
      ['timed_out', 'Default'],
    ];

    for (const [conclusion, expectedColor] of expectedColors) {
      const card = renderGitHubWorkflowTemplate({
        event: 'completed',
        conclusion,
        workflow: 'CI/CD Pipeline',
        repo: 'org/repo',
        branch: 'main',
        author: 'octocat',
        url: 'https://github.com/org/repo/actions/runs/123',
      });

      const items = getContentItems(card);
      const badgeBlock = items.find(
        (item) => item.type === 'TextBlock' && item.weight === 'Bolder' && item.size === 'Small',
      );
      expect(badgeBlock?.color).toBe(expectedColor);
    }
  });

  it('renders branch, author, and sha facts', () => {
    const card = renderGitHubWorkflowTemplate({
      event: 'completed',
      conclusion: 'success',
      workflow: 'CI/CD Pipeline',
      repo: 'org/repo',
      branch: 'main',
      author: 'octocat',
      url: 'https://github.com/org/repo/actions/runs/123',
      sha: 'a1b2c3d',
    });

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === 'FactSet');
    const facts = factSetBlock?.facts as Array<Record<string, string>>;

    expect(facts).toEqual([
      { title: 'Branch:', value: 'main' },
      { title: 'Author:', value: 'octocat' },
      { title: 'Commit:', value: 'a1b2c3d' },
    ]);
  });

  it('truncates commit message to 300 chars', () => {
    const card = renderGitHubWorkflowTemplate({
      event: 'completed',
      conclusion: 'failure',
      workflow: 'CI/CD Pipeline',
      repo: 'org/repo',
      branch: 'feature/long-msg',
      author: 'octocat',
      url: 'https://github.com/org/repo/actions/runs/123',
      message: 'x'.repeat(350),
    });

    const items = getContentItems(card);
    const msgBlock = items.find(
      (item) => item.isSubtle === true && item.type === 'TextBlock' && typeof item.text === 'string' && (item.text as string).length > 50,
    );
    expect(msgBlock).toBeDefined();
    expect((msgBlock?.text as string).length).toBe(300);
    expect(msgBlock?.text).toBe(`${'x'.repeat(297)}...`);
  });
});
