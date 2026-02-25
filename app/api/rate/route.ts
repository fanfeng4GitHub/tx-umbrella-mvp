import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const rateSchema = z.object({
  coverageAmount: z.coerce.number().positive(),
  locationCount: z.coerce.number().int().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.RATE_API_KEY;

    if (!expectedKey) {
      return NextResponse.json({ error: 'RATE_API_KEY is not configured on server' }, { status: 500 });
    }

    if (apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { coverageAmount, locationCount } = rateSchema.parse(body);

    const premium = Number((((coverageAmount / 1000) * 2.3) * locationCount).toFixed(2));

    return NextResponse.json({
      input: { coverageAmount, locationCount },
      formula: '(coverageAmount / 1000) * 2.3 * locationCount',
      premium,
      currency: 'USD'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}
