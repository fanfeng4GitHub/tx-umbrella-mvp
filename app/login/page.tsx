import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold mb-1">TX Umbrella MVP</h1>
        <p className="text-sm text-slate-500 mb-5">Sign in to quote and issue Texas umbrella policies.</p>
        <LoginForm />
      </div>
    </div>
  );
}
