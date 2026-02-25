export type Occupancy = 'LRO' | 'STR' | 'VACANT';

export const TX_RATING_CONFIG = {
  MIN_UNDERLYING_LIMIT: 300_000,
  MIN_PROPERTY_COUNT: 1,
  MAX_PROPERTY_COUNT: 5,
  TX_BASE_RATE: 500,
  TX_TAX_RATE: 0.0485,
  TX_FLAT_FEE: 35,
  LIMIT_FACTOR: {
    1_000_000: 1.0,
    2_000_000: 1.6,
    5_000_000: 2.8
  } as Record<number, number>,
  PROPERTY_COUNT_FACTOR: {
    1: 1.0,
    2: 1.15,
    3: 1.3,
    4: 1.45,
    5: 1.6
  } as Record<number, number>
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

  const limitFactor = cfg.LIMIT_FACTOR[input.umbrellaLimit];
  if (!limitFactor) {
    return referResult('Unsupported umbrella limit. Allowed: 1M, 2M, 5M.', cfg);
  }

  const propertyFactor = cfg.PROPERTY_COUNT_FACTOR[input.propertyCount];
  if (!propertyFactor) {
    return referResult('Unsupported property count factor.', cfg);
  }

  const base = round2(cfg.TX_BASE_RATE * limitFactor * propertyFactor);
  const taxesAndFees = round2(base * cfg.TX_TAX_RATE + cfg.TX_FLAT_FEE);
  const totalPremium = round2(base + taxesAndFees);

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
