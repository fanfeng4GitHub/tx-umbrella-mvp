import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import SubmissionActions from './submission-actions';
import DraftEdit from './draft-edit';

export default async function SubmissionDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      account: true,
      properties: true,
      quotes: { orderBy: { version: 'desc' } },
      policy: true
    }
  });

  if (!submission) return notFound();
  if (user.role !== 'ADMIN' && submission.createdByUserId !== user.id) return notFound();

  const latest = submission.quotes[0];
  const latestRating = latest?.ratingOutputsJson as any;
  const isRefer = Boolean(latestRating?.refer);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Submission {submission.id.slice(0, 8)}...</h1>
        <Link href="/dashboard" className="text-blue-600 underline">Back</Link>
      </div>

      <div className="card space-y-2">
        <p><b>Insured:</b> {submission.account.name}</p>
        <p><b>Status:</b> {submission.status}</p>
        <p><b>State of Risk:</b> {submission.stateOfRisk}</p>
        <p><b>Underlying Limit:</b> ${submission.underlyingLiabilityLimit.toLocaleString()}</p>
        <p><b>Umbrella Limit:</b> ${submission.umbrellaLimit.toLocaleString()}</p>
        <p><b>Properties:</b> {submission.properties.length}</p>
      </div>

      {submission.status === 'DRAFT' ? (
        <DraftEdit
          submissionId={submission.id}
          underlying={submission.underlyingLiabilityLimit}
          umbrella={submission.umbrellaLimit}
          effectiveDate={submission.effectiveDate ? new Date(submission.effectiveDate).toISOString().slice(0, 10) : undefined}
        />
      ) : null}

      <div className="card">
        <h2 className="font-semibold mb-2">Property Schedule</h2>
        <ul className="text-sm list-disc ml-5">
          {submission.properties.map((p) => (
            <li key={p.id}>{p.address1}, {p.city}, {p.state} {p.zip} ({p.occupancyType}, {p.units} unit(s))</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Latest Quote</h2>
        {latest ? (
          <div className="text-sm space-y-1">
            <p><b>Version:</b> {latest.version}</p>
            <p><b>Base Premium:</b> ${latest.basePremium.toString()}</p>
            <p><b>Taxes + Fees:</b> ${latest.taxesAndFees.toString()}</p>
            <p><b>Total Premium:</b> ${latest.totalPremium.toString()}</p>
            <p><b>Refer:</b> {isRefer ? 'Yes' : 'No'}</p>
            {isRefer ? <p className="text-red-600"><b>Reason:</b> {latestRating?.reason}</p> : null}
          </div>
        ) : <p className="text-sm text-slate-500">No quote yet.</p>}
      </div>

      {submission.policy ? (
        <div className="card text-sm space-y-2">
          <h2 className="font-semibold">Issued Policy</h2>
          <p><b>Policy Number:</b> {submission.policy.policyNumber}</p>
          <p><b>Total Premium:</b> ${submission.policy.totalPremium.toString()}</p>
          <Link className="text-blue-600 underline" href={`/policies/${submission.policy.id}`}>Open Policy</Link>
          <a className="text-blue-600 underline block" href={`/api/policies/${submission.policy.id}/pdf`} target="_blank">Download Declarations PDF</a>
        </div>
      ) : (
        <SubmissionActions submissionId={submission.id} hasQuote={Boolean(latest)} allowIssue={Boolean(latest) && !isRefer} />
      )}
    </main>
  );
}
