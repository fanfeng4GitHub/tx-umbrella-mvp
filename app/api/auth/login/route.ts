import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validators';
import { createSession, verifyCredentials } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);

    const user = await verifyCredentials(parsed.email, parsed.password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSession(user.id);
    await auditLog({ userId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Login failed' }, { status: 400 });
  }
}
