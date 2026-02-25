import { NextRequest, NextResponse } from 'next/server';
import { requireRequestUser } from '@/lib/auth';
import { createSubmissionSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await requireRequestUser(req);
    const body = await req.json();
    const parsed = createSubmissionSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          ...parsed.account,
          email: parsed.account.email || null,
          contactName: parsed.account.contactName || null,
          phone: parsed.account.phone || null,
          mailingAddress2: parsed.account.mailingAddress2 || null,
          createdByUserId: user.id,
          state: 'TX'
        }
      });

      const submission = await tx.submission.create({
        data: {
          accountId: account.id,
          status: 'DRAFT',
          effectiveDate: parsed.submission.effectiveDate ? new Date(parsed.submission.effectiveDate) : null,
          stateOfRisk: 'TX',
          underlyingLiabilityLimit: parsed.submission.underlyingLiabilityLimit,
          umbrellaLimit: parsed.submission.umbrellaLimit,
          totalProperties: parsed.properties.length,
          createdByUserId: user.id
        }
      });

      await tx.property.createMany({
        data: parsed.properties.map((p) => ({
          submissionId: submission.id,
          address1: p.address1,
          address2: p.address2 || null,
          city: p.city,
          state: 'TX',
          zip: p.zip,
          occupancyType: p.occupancyType,
          units: p.units
        }))
      });

      return submission;
    });

    await auditLog({
      userId: user.id,
      action: 'CREATE_SUBMISSION',
      entityType: 'Submission',
      entityId: result.id,
      details: { totalProperties: parsed.properties.length }
    });

    return NextResponse.json({ submissionId: result.id });
  } catch (err: any) {
    const status = ['UNAUTHENTICATED', 'FORBIDDEN'].includes(err?.message) ? 401 : 400;
    return NextResponse.json({ error: err?.message || 'Failed to create submission' }, { status });
  }
}
