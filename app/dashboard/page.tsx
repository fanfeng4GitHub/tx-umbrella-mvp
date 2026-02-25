import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import LogoutButton from '@/app/components/LogoutButton';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const where = user.role === 'ADMIN' ? {} : { createdByUserId: user.id };

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      account: true,
      quotes: { orderBy: { version: 'desc' }, take: 1 },
      policy: true,
      properties: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">Signed in as {user.email} ({user.role})</p>
        </div>
        <div className="flex gap-2">
          <Link href="/submissions/new" className="btn-primary">New Quote Submission</Link>
          <LogoutButton />
        </div>
      </header>

      <div className="card">
        <h2 className="font-semibold mb-3">Quotes / Policies</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b">
              <tr>
                <th className="py-2">Submission</th>
                <th>Insured</th>
                <th>Status</th>
                <th>Latest Premium</th>
                <th>Policy</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const latestQuote = s.quotes[0];
                return (
                  <tr key={s.id} className="border-b">
                    <td className="py-2">{s.id.slice(0, 8)}...</td>
                    <td>{s.account.name}</td>
                    <td>{s.status}</td>
                    <td>{latestQuote ? `$${latestQuote.totalPremium}` : '-'}</td>
                    <td>{s.policy ? <Link className="text-blue-600 underline" href={`/policies/${s.policy.id}`}>{s.policy.policyNumber}</Link> : '-'}</td>
                    <td>{new Date(s.updatedAt).toISOString().slice(0,10)}</td>
                    <td>
                      <Link className="text-blue-600 underline" href={`/submissions/${s.id}`}>Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
