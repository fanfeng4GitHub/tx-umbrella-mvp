"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SubmissionActions({ submissionId, hasQuote, allowIssue }: { submissionId: string; hasQuote: boolean; allowIssue: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<'quote' | 'issue' | null>(null);

  async function runQuote() {
    setLoading('quote');
    const res = await fetch(`/api/submissions/${submissionId}/quote`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || 'Quote failed');
    else if (data.refer) setMsg(`Quote referred: ${data.reason}`);
    else setMsg(`Quoted successfully. Total premium: $${data.totalPremium}`);
    setLoading(null);
    router.refresh();
  }

  async function issue() {
    setLoading('issue');
    const res = await fetch(`/api/submissions/${submissionId}/issue`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || 'Issue failed');
    else setMsg(`Issued ${data.policyNumber}`);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Actions</h2>
      <div className="flex gap-2">
        <button onClick={runQuote} className="btn-primary" disabled={loading !== null}>
          {loading === 'quote' ? 'Rating...' : 'Rate Quote'}
        </button>
        <button onClick={issue} className="btn-secondary" disabled={loading !== null || !allowIssue}>
          {loading === 'issue' ? 'Issuing...' : 'Issue Policy'}
        </button>
      </div>
      {!hasQuote ? <p className="text-xs text-slate-500">You must rate first before issuing.</p> : null}
      {hasQuote && !allowIssue ? <p className="text-xs text-amber-700">Issue disabled: quote is REFER / not eligible.</p> : null}
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
