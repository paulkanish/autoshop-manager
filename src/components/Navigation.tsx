import { auth, signOut } from '@/lib/auth';
import Link from 'next/link';

export default async function Navigation() {
  const session = await auth();
  const userRole = session?.user?.role;

  if (!session?.user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <Link href="/dashboard" className="text-gray-900 font-semibold hover:text-blue-600">
              Dashboard
            </Link>

            {userRole === 'ADMIN' && (
              <Link href="/admin" className="text-gray-700 hover:text-red-600">
                Admin Panel
              </Link>
            )}

            {userRole === 'ADMIN' && (
              <Link href="/admin/users" className="text-gray-700 hover:text-red-600">
                Users
              </Link>
            )}

            {(userRole === 'MECHANIC' || userRole === 'ADMIN') && (
              <Link href="/mechanic" className="text-gray-700 hover:text-blue-600">
                Mechanic View
              </Link>
            )}

            {(userRole === 'OWNER' || userRole === 'ADMIN') && (
              <Link href="/owner" className="text-gray-700 hover:text-green-600">
                Owner View
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {session.user.name} ({userRole})
            </span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
