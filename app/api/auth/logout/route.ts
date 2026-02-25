import { NextResponse } from 'next/server';
import { destroySession, getCurrentUser } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

export async function POST() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await auditLog({ userId: user.id, action: 'LOGOUT', entityType: 'User', entityId: user.id });
  }
  return NextResponse.json({ ok: true });
}
