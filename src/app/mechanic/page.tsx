import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MechanicPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
        <h1 className="text-2xl font-bold text-blue-600">Mechanic Dashboard</h1>
        <p className="mt-4 text-gray-700">
          Welcome, {session.user.name}. You can view and manage your assigned repair jobs here.
        </p>
        <p className="mt-2 text-sm text-gray-500">Authenticated Role: {session.user.role}</p>
      </div>
    </div>
  );
}
