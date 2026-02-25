import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import NewSubmissionForm from './NewSubmissionForm';

export default async function NewSubmissionPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">New Texas Umbrella Quote Submission</h1>
      <div className="card">
        <NewSubmissionForm />
      </div>
    </main>
  );
}
