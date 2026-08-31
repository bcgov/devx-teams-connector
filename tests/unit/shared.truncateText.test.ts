import { describe, expect, it } from 'vitest';

import { truncateText } from '../../src/templates/shared';

const hasLoneSurrogate = (value: string): boolean => /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value);

describe('truncateText', () => {
  it('returns input untouched when within the limit', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('truncates with an ellipsis when over the limit', () => {
    expect(truncateText('abcdefghij', 8)).toBe('abcdefg\u2026');
  });

  it('does not split a surrogate pair at the boundary', () => {
    // '😀' occupies indices 7 and 8, so a naive slice(0, 8) would cut it in half.
    const result = truncateText('abcdefg😀hij', 9);

    expect(result).toBe('abcdefg\u2026');
    expect(hasLoneSurrogate(result)).toBe(false);
  });

  it('drops an unpaired high surrogate at the boundary', () => {
    const result = truncateText('abcdefg\uD83Dhij', 9);

    expect(result).toBe('abcdefg\u2026');
    expect(hasLoneSurrogate(result)).toBe(false);
  });

  it('never emits a lone surrogate for any boundary', () => {
    const value = '😀'.repeat(20);

    for (let maxLength = 3; maxLength < value.length; maxLength += 1) {
      const result = truncateText(value, maxLength);
      expect(hasLoneSurrogate(result)).toBe(false);
      expect(result.length).toBeLessThanOrEqual(maxLength);
    }
  });
});
