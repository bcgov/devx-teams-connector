import type { AdaptiveCard } from '../types';

export type AdaptiveContainerStyle = 'default' | 'accent' | 'good' | 'warning' | 'attention';
type AdaptiveTextColor = 'Default' | 'Accent' | 'Good' | 'Warning' | 'Attention';

type RelativeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

interface FactEntry {
  title: string;
  value?: string | number | null;
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function toCategoryTextColor(style: AdaptiveContainerStyle): AdaptiveTextColor {
  switch (style) {
    case 'good':
      return 'Good';
    case 'warning':
      return 'Warning';
    case 'attention':
      return 'Attention';
    case 'accent':
      return 'Accent';
    default:
      return 'Default';
  }
}

export function toTextColor(style: AdaptiveContainerStyle): AdaptiveTextColor {
  return toCategoryTextColor(style);
}

export function createCardFrame(
  style: AdaptiveContainerStyle,
  items: Array<Record<string, unknown>>,
): Record<string, unknown> {
  void style;

  return {
    type: 'ColumnSet',
    columns: [
      {
        type: 'Column',
        width: 'stretch',
        spacing: 'None',
        items,
      },
    ],
  };
}

export interface HeaderContainerOptions {
  topLine?: string;
  extraItems?: Array<Record<string, unknown>>;
  actions?: Array<Record<string, unknown>>;
}

export function createHeaderContainer(
  title: string,
  style: AdaptiveContainerStyle,
  subtitle?: string,
  category?: string,
  badge?: string,
  options?: HeaderContainerOptions,
): Record<string, unknown> {
  const contentItems: Array<Record<string, unknown>> = [];

  if (options?.topLine) {
    contentItems.push({
      type: 'TextBlock',
      text: options.topLine,
      size: 'Small',
      isSubtle: true,
      spacing: 'None',
    });
  }

  if (category || badge) {
    const columns: Array<Record<string, unknown>> = [];

    if (category) {
      columns.push({
        type: 'Column',
        width: 'stretch',
        items: [
          {
            type: 'TextBlock',
            text: category,
            size: 'Small',
            weight: 'Bolder',
            color: toCategoryTextColor(style),
            wrap: true,
            spacing: 'None',
          },
        ],
      });
    } else {
      columns.push({
        type: 'Column',
        width: 'stretch',
        items: [{ type: 'TextBlock', text: ' ', spacing: 'None' }],
      });
    }

    if (badge) {
      columns.push({
        type: 'Column',
        width: 'auto',
        items: [
          {
            type: 'TextBlock',
            text: badge,
            size: 'Small',
            isSubtle: true,
            horizontalAlignment: 'Right',
            wrap: false,
            spacing: 'None',
          },
        ],
      });
    }

    contentItems.push({
      type: 'ColumnSet',
      spacing: 'None',
      columns,
    });
  }

  contentItems.push({
    type: 'TextBlock',
    text: title,
    weight: 'Bolder',
    wrap: true,
    size: 'Large',
    spacing: category || badge ? 'Small' : 'None',
  });

  if (subtitle) {
    contentItems.push({
      type: 'TextBlock',
      text: subtitle,
      size: 'Small',
      isSubtle: true,
      wrap: true,
      spacing: 'None',
    });
  }

  if (options?.extraItems) {
    contentItems.push(...options.extraItems);
  }

  if (options?.actions && options.actions.length > 0) {
    contentItems.push({
      type: 'ActionSet',
      spacing: 'Medium',
      actions: options.actions,
    });
  }

  return {
    type: 'Container',
    items: contentItems,
  };
}

export function createFactSet(entries: FactEntry[]): Record<string, unknown> | null {
  const facts = entries
    .filter((entry) => entry.value !== undefined && entry.value !== null && entry.value !== '')
    .map((entry) => ({
      title: `${entry.title}:`,
      value: String(entry.value),
    }));

  if (facts.length === 0) {
    return null;
  }

  return {
    type: 'FactSet',
    facts,
    spacing: 'Medium',
  };
}

export function createSectionSeparator(): Record<string, unknown> {
  return {
    type: 'TextBlock',
    text: ' ',
    separator: true,
    spacing: 'Medium',
    isSubtle: true,
  };
}

export function createBaseCard(
  body: Array<Record<string, unknown>>,
  actions?: Array<Record<string, unknown>>,
): AdaptiveCard {
  const card: AdaptiveCard = {
    type: 'AdaptiveCard',
    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body,
  };

  if (actions && actions.length > 0) {
    card.actions = actions;
  }

  return card;
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

export function formatRelativeTimeOrIso(value: string, nowMs: number = Date.now()): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const diffSeconds = Math.round((parsed.getTime() - nowMs) / 1000);
  const absDiffSeconds = Math.abs(diffSeconds);

  const units: Array<{ unit: RelativeUnit; seconds: number }> = [
    { unit: 'year', seconds: 31_536_000 },
    { unit: 'month', seconds: 2_592_000 },
    { unit: 'week', seconds: 604_800 },
    { unit: 'day', seconds: 86_400 },
    { unit: 'hour', seconds: 3_600 },
    { unit: 'minute', seconds: 60 },
  ];

  const selected = units.find((candidate) => absDiffSeconds >= candidate.seconds);

  try {
    if (!selected) {
      return relativeTimeFormatter.format(diffSeconds, 'second');
    }

    return relativeTimeFormatter.format(Math.round(diffSeconds / selected.seconds), selected.unit);
  } catch {
    return parsed.toISOString();
  }
}
