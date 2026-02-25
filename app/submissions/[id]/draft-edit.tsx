"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DraftEdit({
  submissionId,
  underlying,
  umbrella,
  effectiveDate
}: {
  submissionId: string;
  underlying: number;
  umbrella: number;
  effectiveDate?: string;
}) {
  const router = useRouter();
  const [u, setU] = useState(String(underlying));
  const [umb, setUmb] = useState(String(umbrella));
  const [eff, setEff] = useState(effectiveDate || '');
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    const res = await fetch(`/api/submissions/${submissionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        underlyingLiabilityLimit: Number(u),
        umbrellaLimit: Number(umb),
        effectiveDate: eff || undefined
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || 'Update failed');
      return;
    }
    setMsg('Draft updated');
    router.refresh();
  }

  return (
    <div className="card space-y-2">
      <h2 className="font-semibold">Edit Draft</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm mb-1">Underlying</label>
          <select className="input" value={u} onChange={(e) => setU(e.target.value)}>
            <option value="300000">$300,000</option>
            <option value="1000000">$1,000,000</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Umbrella</label>
          <select className="input" value={umb} onChange={(e) => setUmb(e.target.value)}>
            <option value="1000000">$1,000,000</option>
            <option value="2000000">$2,000,000</option>
            <option value="5000000">$5,000,000</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Effective Date</label>
          <input type="date" className="input" value={eff} onChange={(e) => setEff(e.target.value)} />
        </div>
      </div>
      <button className="btn-secondary" onClick={save}>Save Draft Changes</button>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
