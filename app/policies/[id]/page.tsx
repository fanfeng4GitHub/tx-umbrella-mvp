import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function PolicyPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const policy = await prisma.policy.findUnique({
    where: { id: params.id },
    include: { account: true, submission: { include: { properties: true } } }
  });

  if (!policy) return notFound();
  if (user.role !== 'ADMIN' && policy.submission.createdByUserId !== user.id) return notFound();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Policy {policy.policyNumber}</h1>
        <Link href="/dashboard" className="text-blue-600 underline">Back</Link>
      </div>

      <div className="card text-sm space-y-1">
        <p><b>Named Insured:</b> {policy.account.name}</p>
        <p><b>Effective:</b> {new Date(policy.effectiveDate).toISOString().slice(0, 10)}</p>
        <p><b>Expiration:</b> {new Date(policy.expirationDate).toISOString().slice(0, 10)}</p>
        <p><b>Umbrella Limit:</b> ${policy.umbrellaLimit.toLocaleString()}</p>
        <p><b>Underlying Liability Limit:</b> ${policy.underlyingLiabilityLimit.toLocaleString()}</p>
        <p><b>Total Premium:</b> ${policy.totalPremium.toString()}</p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Scheduled Properties</h2>
        <ul className="list-disc ml-5 text-sm">
          {policy.submission.properties.map((p) => (
            <li key={p.id}>{p.address1}, {p.city}, TX {p.zip} ({p.occupancyType}, {p.units} unit(s))</li>
          ))}
        </ul>
      </div>

      <a href={`/api/policies/${policy.id}/pdf`} className="btn-primary inline-block">Download Declarations PDF</a>
    </main>
  );
}
