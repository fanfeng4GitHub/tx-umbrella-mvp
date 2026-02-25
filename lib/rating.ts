export type Occupancy = 'LRO' | 'STR' | 'VACANT';

export const TX_RATING_CONFIG = {
  MIN_UNDERLYING_LIMIT: 300_000,
  MIN_PROPERTY_COUNT: 1,
  MAX_PROPERTY_COUNT: 5,
  PER_THOUSAND_RATE: 2.3
};

export type RatingInput = {
  umbrellaLimit: number;
  propertyCount: number;
  underlyingLiabilityLimit: number;
  occupancyTypes: Occupancy[];
};

export type RatingResult = {
  eligible: boolean;
  refer: boolean;
  reason?: string;
  basePremium: number;
  taxesAndFees: number;
  totalPremium: number;
  configSnapshot: typeof TX_RATING_CONFIG;
};

export function rateTexasUmbrella(input: RatingInput): RatingResult {
  const cfg = TX_RATING_CONFIG;

  if (input.underlyingLiabilityLimit < cfg.MIN_UNDERLYING_LIMIT) {
    return referResult(
      `Underlying liability limit must be at least $${cfg.MIN_UNDERLYING_LIMIT.toLocaleString()}.`,
      cfg
    );
  }

  if (input.propertyCount < cfg.MIN_PROPERTY_COUNT || input.propertyCount > cfg.MAX_PROPERTY_COUNT) {
    return referResult(
      `Property count ${input.propertyCount} not supported for MVP. Supported range is ${cfg.MIN_PROPERTY_COUNT}-${cfg.MAX_PROPERTY_COUNT}.`,
      cfg
    );
  }

  if (input.occupancyTypes.includes('VACANT')) {
    return referResult('Refer: VACANT occupancy requires manual underwriting review.', cfg);
  }

  const base = round2((input.umbrellaLimit / 1000) * cfg.PER_THOUSAND_RATE * input.propertyCount);
  const taxesAndFees = 0;
  const totalPremium = base;

  return {
    eligible: true,
    refer: false,
    basePremium: base,
    taxesAndFees,
    totalPremium,
    configSnapshot: cfg
  };
}

function referResult(reason: string, cfg: typeof TX_RATING_CONFIG): RatingResult {
  return {
    eligible: false,
    refer: true,
    reason,
    basePremium: 0,
    taxesAndFees: 0,
    totalPremium: 0,
    configSnapshot: cfg
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
