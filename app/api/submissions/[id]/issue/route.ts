import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { prisma } from '@/lib/db';
import { requireRequestUser } from '@/lib/auth';
import { nextTxPolicyNumber } from '@/lib/policy-number';
import { generateDecPdf } from '@/lib/pdf';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRequestUser(req);

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        account: true,
        properties: true,
        quotes: { orderBy: { version: 'desc' }, take: 1 },
        policy: true
      }
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (user.role !== 'ADMIN' && submission.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (submission.policy) {
      return NextResponse.json({ error: 'Submission already issued' }, { status: 400 });
    }

    const latestQuote = submission.quotes[0];
    if (!latestQuote) {
      return NextResponse.json({ error: 'Submission must be quoted first' }, { status: 400 });
    }

    const ratingOutput = latestQuote.ratingOutputsJson as any;
    if (ratingOutput?.refer) {
      return NextResponse.json({ error: `Cannot issue: ${ratingOutput?.reason || 'Submission is REFER.'}` }, { status: 400 });
    }

    const effectiveDate = submission.effectiveDate ?? new Date();
    const expirationDate = dayjs(effectiveDate).add(1, 'year').subtract(1, 'day').toDate();

    const policy = await prisma.$transaction(async (tx) => {
      const policyNumber = await nextTxPolicyNumber(tx, effectiveDate);

      const decPath = await generateDecPdf({
        policyNumber,
        accountName: submission.account.name,
        mailingAddress: `${submission.account.mailingAddress1}, ${submission.account.city}, TX ${submission.account.zip}`,
        effectiveDate,
        expirationDate,
        umbrellaLimit: submission.umbrellaLimit,
        underlyingLiabilityLimit: submission.underlyingLiabilityLimit,
        totalPremium: latestQuote.totalPremium.toString(),
        properties: submission.properties.map((p) => ({
          address: `${p.address1}, ${p.city}, TX ${p.zip}`,
          occupancyType: p.occupancyType,
          units: p.units
        }))
      });

      const created = await tx.policy.create({
        data: {
          policyNumber,
          submissionId: submission.id,
          accountId: submission.accountId,
          issuedAt: new Date(),
          effectiveDate,
          expirationDate,
          umbrellaLimit: submission.umbrellaLimit,
          underlyingLiabilityLimit: submission.underlyingLiabilityLimit,
          totalPremium: latestQuote.totalPremium,
          decPdfPathOrBlobRef: decPath,
          createdByUserId: user.id
        }
      });

      await tx.submission.update({ where: { id: submission.id }, data: { status: 'ISSUED' } });
      return created;
    });

    await auditLog({
      userId: user.id,
      action: 'ISSUE_POLICY',
      entityType: 'Policy',
      entityId: policy.id,
      details: { submissionId: submission.id, policyNumber: policy.policyNumber }
    });

    return NextResponse.json({ policyId: policy.id, policyNumber: policy.policyNumber });
  } catch (err: any) {
    const status = ['UNAUTHENTICATED', 'FORBIDDEN'].includes(err?.message) ? 401 : 400;
    return NextResponse.json({ error: err?.message || 'Issue failed' }, { status });
  }
}
