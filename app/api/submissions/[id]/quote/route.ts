import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRequestUser } from '@/lib/auth';
import { rateTexasUmbrella } from '@/lib/rating';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRequestUser(req);
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: { properties: true, quotes: true }
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (user.role !== 'ADMIN' && submission.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rating = rateTexasUmbrella({
      occupancyTypes: submission.properties.map((p) => p.occupancyType),
      propertyCount: submission.properties.length,
      underlyingLiabilityLimit: submission.underlyingLiabilityLimit,
      umbrellaLimit: submission.umbrellaLimit
    });

    if (!rating.eligible && !String(rating.reason || '').startsWith('Refer: VACANT')) {
      return NextResponse.json({ error: rating.reason || 'Not eligible for quote' }, { status: 400 });
    }

    const nextVersion = (submission.quotes[submission.quotes.length - 1]?.version || 0) + 1;

    const quote = await prisma.quote.create({
      data: {
        submissionId: submission.id,
        version: nextVersion,
        basePremium: rating.basePremium,
        taxesAndFees: rating.taxesAndFees,
        totalPremium: rating.totalPremium,
        ratingInputsJson: {
          underlyingLiabilityLimit: submission.underlyingLiabilityLimit,
          umbrellaLimit: submission.umbrellaLimit,
          totalProperties: submission.properties.length
        },
        ratingOutputsJson: rating
      }
    });

    await prisma.submission.update({ where: { id: submission.id }, data: { status: 'QUOTED' } });

    await auditLog({
      userId: user.id,
      action: 'QUOTE_SUBMISSION',
      entityType: 'Quote',
      entityId: quote.id,
      details: { submissionId: submission.id, version: quote.version }
    });

    return NextResponse.json({
      quoteId: quote.id,
      totalPremium: quote.totalPremium,
      refer: rating.refer,
      reason: rating.reason || null
    });
  } catch (err: any) {
    const status = ['UNAUTHENTICATED', 'FORBIDDEN'].includes(err?.message) ? 401 : 400;
    return NextResponse.json({ error: err?.message || 'Quote failed' }, { status });
  }
}
