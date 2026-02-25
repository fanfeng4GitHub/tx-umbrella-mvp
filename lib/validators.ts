import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const createSubmissionSchema = z.object({
  account: z.object({
    type: z.enum(['PERSON', 'ENTITY']),
    name: z.string().min(2),
    contactName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    mailingAddress1: z.string().min(3),
    mailingAddress2: z.string().optional(),
    city: z.string().min(2),
    state: z.literal('TX'),
    zip: z.string().regex(/^\d{5}$/)
  }),
  submission: z.object({
    underlyingLiabilityLimit: z.coerce.number().int().min(300000),
    umbrellaLimit: z.coerce.number().int().refine((v) => [1000000, 2000000, 5000000].includes(v), {
      message: 'Umbrella limit must be 1M, 2M, or 5M'
    }),
    effectiveDate: z.string().optional()
  }),
  properties: z.array(
    z.object({
      address1: z.string().min(3),
      address2: z.string().optional(),
      city: z.string().min(2),
      state: z.literal('TX'),
      zip: z.string().regex(/^\d{5}$/),
      occupancyType: z.enum(['LRO', 'STR', 'VACANT']).default('LRO'),
      units: z.coerce.number().int().min(1).default(1)
    })
  ).min(1)
});

export const updateDraftSchema = z.object({
  underlyingLiabilityLimit: z.coerce.number().int().min(300000),
  umbrellaLimit: z.coerce.number().int().refine((v) => [1000000, 2000000, 5000000].includes(v), {
    message: 'Umbrella limit must be 1M, 2M, or 5M'
  }),
  effectiveDate: z.string().optional()
});
