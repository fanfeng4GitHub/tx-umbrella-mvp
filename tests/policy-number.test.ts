import { describe, it, expect } from 'vitest';
import { buildPolicyNumber } from '@/lib/policy-number';

describe('buildPolicyNumber', () => {
  it('formats REU-{YY}TX-{SEQUENCE}', () => {
    const n = buildPolicyNumber(new Date('2026-07-15'), 12);
    expect(n).toBe('REU-26TX-000012');
  });

  it('pads sequence to 6 chars', () => {
    const n = buildPolicyNumber(new Date('2025-06-01T00:00:00Z'), 1);
    expect(n).toBe('REU-25TX-000001');
  });
});
