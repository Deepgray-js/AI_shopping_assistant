import { describe, expect, it } from 'vitest';
import { formatOrderDateTime } from '@/lib/utils';

describe('formatOrderDateTime', () => {
  it('formats order timestamps with a fixed Shanghai timezone output', () => {
    expect(formatOrderDateTime('2026-05-21T09:12:00+08:00')).toBe('2026-05-21 09:12');
    expect(formatOrderDateTime('2026-05-21T01:12:00.000Z')).toBe('2026-05-21 09:12');
  });
});
