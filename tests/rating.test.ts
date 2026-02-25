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

    const expectedBase = Number((TX_RATING_CONFIG.TX_BASE_RATE * 1.0 * 1.15).toFixed(2));
    const expectedTF = Number((expectedBase * TX_RATING_CONFIG.TX_TAX_RATE + TX_RATING_CONFIG.TX_FLAT_FEE).toFixed(2));
    expect(result.basePremium).toBe(expectedBase);
    expect(result.taxesAndFees).toBe(expectedTF);
    expect(result.totalPremium).toBe(Number((expectedBase + expectedTF).toFixed(2)));
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
