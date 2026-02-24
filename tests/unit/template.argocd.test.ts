import { describe, expect, it } from 'vitest';

import { renderArgoCdTemplate } from '../../src/templates/argocd';

function getContentItems(card: { body: Array<Record<string, unknown>> }): Array<Record<string, unknown>> {
  const columns = (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe('renderArgoCdTemplate', () => {
  it('maps event to expected action label', () => {
    const cases = [
      {
        event: 'sync_succeeded' as const,
        expectedTitle: 'View in ArgoCD',
      },
      {
        event: 'sync_failed' as const,
        expectedTitle: 'View in ArgoCD',
      },
      {
        event: 'out_of_sync' as const,
        expectedTitle: 'View Diff in ArgoCD',
      },
    ];

    for (const testCase of cases) {
      const card = renderArgoCdTemplate({
        event: testCase.event,
        application: 'platform-registry-prod',
        url: 'https://argocd.example.com/applications/platform-registry-prod',
      });

      const items = getContentItems(card);
      const actionSet = items.find((item) => item.type === 'ActionSet');
      const actions = actionSet?.actions as Array<Record<string, unknown>>;
      expect(actions?.[0]).toEqual({
        type: 'Action.OpenUrl',
        title: testCase.expectedTitle,
        url: 'https://argocd.example.com/applications/platform-registry-prod',
      });
    }
  });

  it('renders message and structured facts when optional fields exist', () => {
    const card = renderArgoCdTemplate({
      event: 'sync_failed',
      application: 'platform-registry-prod',
      syncStatus: 'OutOfSync',
      healthStatus: 'Degraded',
      revision: 'f4e5d6c',
      project: 'platform',
      target: 'abc123-prod',
      timestamp: '2026-02-22T12:00:00Z',
      message: 'ComparisonError: failed to sync Deployment/api-gateway',
    });

    const items = getContentItems(card);

    const errorContainer = items.find(
      (item) => item.type === 'Container',
    );
    expect(errorContainer).toBeDefined();

    const factSetBlock = items.find((item) => item.type === 'FactSet');
    const facts = factSetBlock?.facts as Array<Record<string, string>>;
    expect(facts).toEqual([
      { title: 'Revision:', value: 'f4e5d6c' },
      { title: 'Project:', value: 'platform' },
      { title: 'Target:', value: 'abc123-prod' },
      expect.objectContaining({ title: 'Failed at:' }),
    ]);
  });

  it('renders default sync/health as status pill ColumnSet and omits actions when no url is provided', () => {
    const card = renderArgoCdTemplate({
      event: 'sync_succeeded',
      application: 'platform-registry-prod',
    });

    const items = getContentItems(card);

    const statusPills = items.find(
      (item) => item.type === 'ColumnSet' && item.spacing === 'Small',
    );
    expect(statusPills).toBeDefined();

    const columns = statusPills?.columns as Array<Record<string, unknown>>;
    expect(columns).toHaveLength(2);

    const syncItems = columns[0]?.items as Array<Record<string, unknown>>;
    const healthItems = columns[1]?.items as Array<Record<string, unknown>>;

    expect(syncItems[0]).toMatchObject({ text: '✅ Synced', color: 'Good' });
    expect(healthItems[0]).toMatchObject({ text: '💚 Healthy', color: 'Good' });

    expect(card.actions).toBeUndefined();
  });
});
