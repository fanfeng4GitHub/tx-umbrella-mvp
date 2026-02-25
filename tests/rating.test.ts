import { describe, it, expect } from 'vitest';
import { rateTexasUmbrella, TX_RATING_CONFIG } from '@/lib/rating';

describe('rateTexasUmbrella', () => {
  it('returns deterministic premium for valid input', () => {
    const result = rateTexasUmbrella({
      umbrellaLimit: 1_000_000,
      propertyCount: 2,
      underlyingLiabilityLimit: 1_000_000,
      occupancyTypes: ['LRO', 'LRO']
    });

    expect(result.eligible).toBe(true);
    expect(result.refer).toBe(false);

    const expectedBase = Number(((1_000_000 / 1000) * TX_RATING_CONFIG.PER_THOUSAND_RATE * 2).toFixed(2));
    expect(result.basePremium).toBe(expectedBase);
    expect(result.taxesAndFees).toBe(0);
    expect(result.totalPremium).toBe(expectedBase);
  });

  it('blocks if underlying below minimum', () => {
    const result = rateTexasUmbrella({
      umbrellaLimit: 1_000_000,
      propertyCount: 1,
      underlyingLiabilityLimit: 100_000,
      occupancyTypes: ['LRO']
    });

    expect(result.eligible).toBe(false);
    expect(result.refer).toBe(true);
    expect(result.reason).toContain('Underlying liability limit');
  });

  it('returns refer when any property is VACANT', () => {
    const result = rateTexasUmbrella({
      umbrellaLimit: 1_000_000,
      propertyCount: 1,
      underlyingLiabilityLimit: 1_000_000,
      occupancyTypes: ['VACANT']
    });

    expect(result.refer).toBe(true);
    expect(result.reason).toContain('VACANT');
  });
});
