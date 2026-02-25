"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type PropertyRow = {
  address1: string;
  city: string;
  state: 'TX';
  zip: string;
  occupancyType: 'LRO' | 'STR' | 'VACANT';
  units: number;
};

export default function NewSubmissionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([
    { address1: '', city: '', state: 'TX', zip: '', occupancyType: 'LRO', units: 1 }
  ]);

  function updateProp(index: number, patch: Partial<PropertyRow>) {
    const next = [...properties];
    next[index] = { ...next[index], ...patch };
    setProperties(next);
  }

  function addProperty() {
    setProperties([...properties, { address1: '', city: '', state: 'TX', zip: '', occupancyType: 'LRO', units: 1 }]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const payload = {
      account: {
        type: form.get('accountType'),
        name: form.get('accountName'),
        contactName: form.get('contactName'),
        phone: form.get('phone'),
        email: form.get('email'),
        mailingAddress1: form.get('mailingAddress1'),
        mailingAddress2: form.get('mailingAddress2'),
        city: form.get('mailingCity'),
        state: 'TX',
        zip: form.get('mailingZip')
      },
      submission: {
        underlyingLiabilityLimit: form.get('underlyingLimit'),
        umbrellaLimit: form.get('umbrellaLimit'),
        effectiveDate: form.get('effectiveDate')
      },
      properties
    };

    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to create submission' }));
      setError(data.error || 'Failed to create submission');
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(`/submissions/${data.submissionId}`);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <h2 className="font-semibold">Named Insured</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Account Type</label>
          <select name="accountType" className="input" defaultValue="ENTITY">
            <option value="PERSON">Person</option>
            <option value="ENTITY">Entity</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input name="accountName" className="input" required />
        </div>
        <div><label className="block text-sm mb-1">Contact Name</label><input name="contactName" className="input" /></div>
        <div><label className="block text-sm mb-1">Phone</label><input name="phone" className="input" /></div>
        <div><label className="block text-sm mb-1">Email</label><input name="email" className="input" type="email" /></div>
        <div><label className="block text-sm mb-1">Mailing Address</label><input name="mailingAddress1" className="input" required /></div>
        <div><label className="block text-sm mb-1">Address 2</label><input name="mailingAddress2" className="input" /></div>
        <div><label className="block text-sm mb-1">City</label><input name="mailingCity" className="input" required /></div>
        <div><label className="block text-sm mb-1">ZIP</label><input name="mailingZip" className="input" pattern="\d{5}" required /></div>
      </div>

      <h2 className="font-semibold mt-4">Submission</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm mb-1">Underlying Liability Limit</label>
          <select name="underlyingLimit" className="input" defaultValue="1000000">
            <option value="300000">$300,000</option>
            <option value="1000000">$1,000,000</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Umbrella Limit</label>
          <select name="umbrellaLimit" className="input" defaultValue="1000000">
            <option value="1000000">$1,000,000</option>
            <option value="2000000">$2,000,000</option>
            <option value="5000000">$5,000,000</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Effective Date</label>
          <input name="effectiveDate" className="input" type="date" />
        </div>
      </div>

      <h2 className="font-semibold mt-4">Property Schedule (TX)</h2>
      {properties.map((p, idx) => (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded" key={idx}>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Address</label>
            <input className="input" value={p.address1} onChange={(e) => updateProp(idx, { address1: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm mb-1">City</label>
            <input className="input" value={p.city} onChange={(e) => updateProp(idx, { city: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm mb-1">ZIP</label>
            <input className="input" value={p.zip} onChange={(e) => updateProp(idx, { zip: e.target.value })} pattern="\d{5}" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Occupancy</label>
            <select className="input" value={p.occupancyType} onChange={(e) => updateProp(idx, { occupancyType: e.target.value as PropertyRow['occupancyType'] })}>
              <option value="LRO">LRO</option>
              <option value="STR">STR</option>
              <option value="VACANT">VACANT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Units</label>
            <input className="input" type="number" min={1} value={p.units} onChange={(e) => updateProp(idx, { units: Number(e.target.value) || 1 })} />
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={addProperty}>+ Add Property</button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div>
        <button className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Submission'}</button>
      </div>
    </form>
  );
}
