import { z } from 'zod';

import type { AdaptiveCard } from '../types';

export type AdaptiveContainerStyle = 'default' | 'accent' | 'good' | 'warning' | 'attention';
type AdaptiveTextColor = 'Default' | 'Accent' | 'Good' | 'Warning' | 'Attention';

type RelativeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

interface FactEntry {
  title: string;
  value?: string | number | null;
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const IsoTimestampSchema = z.union([
  z.string().datetime({ offset: true }),
  z.string().datetime(),
]);

function blankToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim().length === 0 ? undefined : value;
}

function clampToMaxLength(value: unknown, maxLength: number): unknown {
  return typeof value === 'string' ? truncateText(value, maxLength) : value;
}

// Oversized input is trimmed to the limit rather than rejected.
export function boundedString(maxLength: number) {
  return z.preprocess(
    (value) => clampToMaxLength(value, maxLength),
    z.string().min(1).max(maxLength),
  );
}

// Blank input on an optional field means "unset", not "invalid".
export function optionalField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(blankToUndefined, schema.optional());
}

export function optionalBoundedString(maxLength: number) {
  return optionalField(boundedString(maxLength));
}

export function toTextColor(style: AdaptiveContainerStyle): AdaptiveTextColor {
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

export function createCardFrame(items: Array<Record<string, unknown>>): Record<string, unknown> {
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

  let sliceEnd = Math.max(0, maxLength - 3);
  const lastCodePoint = sliceEnd > 0 ? (value.codePointAt(sliceEnd - 1) ?? 0) : 0;

  // Dropping a lone high surrogate keeps the output from ending mid-code-point.
  if (lastCodePoint > 0xffff || (lastCodePoint >= 0xd800 && lastCodePoint <= 0xdbff)) {
    sliceEnd -= 1;
  }

  return `${value.slice(0, sliceEnd)}...`;
}

// Join non-empty fields into one line for activity summary
export function createActivitySummary(parts: Array<string | undefined | null>, maxLength = 250): string {
  return truncateText(
    parts
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .map((part) => part.replace(/\s+/g, ' ').trim())
      .join(' - '),
    maxLength,
  );
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
