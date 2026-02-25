import { NextRequest, NextResponse } from 'next/server';
import { requireRequestUser } from '@/lib/auth';
import { updateDraftSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';
import { auditLog } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRequestUser(req);
    const existing = await prisma.submission.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only DRAFT submissions can be edited' }, { status: 400 });
    }
    if (user.role !== 'ADMIN' && existing.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateDraftSchema.parse(body);

    await prisma.submission.update({
      where: { id: existing.id },
      data: {
        effectiveDate: parsed.effectiveDate ? new Date(parsed.effectiveDate) : null,
        underlyingLiabilityLimit: parsed.underlyingLiabilityLimit,
        umbrellaLimit: parsed.umbrellaLimit,
        stateOfRisk: 'TX'
      }
    });

    await auditLog({
      userId: user.id,
      action: 'UPDATE_SUBMISSION',
      entityType: 'Submission',
      entityId: existing.id
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = ['UNAUTHENTICATED', 'FORBIDDEN'].includes(err?.message) ? 401 : 400;
    return NextResponse.json({ error: err?.message || 'Failed to update submission' }, { status });
  }
}
