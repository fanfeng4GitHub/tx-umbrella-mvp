import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { prisma } from '@/lib/db';
import { requireRequestUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRequestUser(req);
    const policy = await prisma.policy.findUnique({
      where: { id: params.id },
      include: { submission: true }
    });

    if (!policy) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (user.role !== 'ADMIN' && policy.submission.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fullPath = path.resolve(policy.decPdfPathOrBlobRef);
    const file = await fs.readFile(fullPath);

    return new NextResponse(file, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${policy.policyNumber}-declarations.pdf"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unable to download PDF' }, { status: 400 });
  }
}
