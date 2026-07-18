'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Hero Banner - Professional Full-Width Layout */}
      <div className="w-full bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* Left Side: Text Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-lg mb-6">
                <span className="text-4xl font-bold text-white">T</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
                <span className="text-white">TONY</span>
                <span className="text-red-600 ml-3">AUTO</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-2xl">
                Professional Auto Repair & Maintenance Services
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 text-sm">
                <span className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-gray-300">🔧 Engine Repair</span>
                <span className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-gray-300"> Battery Service</span>
                <span className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-gray-300">⚡ Electrical</span>
                <span className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 text-gray-300">🚗 Transmission</span>
              </div>
            </div>


            {/* Right Side: Image */}
            <div className="relative h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 bg-gray-800">
              <img
                src="/garage-hero.jpg?v=1"
                alt="Professional auto repair service at Tony Auto"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {getGreeting()}, {user.name?.split(' ')[0] || 'Team'}! 👋
          </h2>
          <p className="text-gray-400">
            Manage your shop efficiently with <span className="text-red-500 font-semibold">Tony Auto Manager</span>
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

          <Link href="/dashboard/shop-board" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer block group">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">Shop Board</h3>
            <p className="text-gray-400 text-sm">View and manage active jobs in real-time</p>
          </Link>

          <Link href="/dashboard/walkin" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 cursor-pointer block group">
            <div className="text-4xl mb-4">🚶</div>
            <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-red-400 transition-colors">New Walk-In</h3>
            <p className="text-gray-400 text-sm">Fast registration for unscheduled arrivals</p>
          </Link>

          <Link href="/dashboard/vehicle-history" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-200 cursor-pointer block group">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-yellow-400 transition-colors">Vehicle History</h3>
            <p className="text-gray-400 text-sm">Search vehicles & view past services</p>
          </Link>

          <Link href="/dashboard/billing" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-200 cursor-pointer block group">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-green-400 transition-colors">Invoicing & Billing</h3>
            <p className="text-gray-400 text-sm">Generate invoices and track payments</p>
          </Link>

        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900/30 to-gray-800 rounded-xl p-6 border border-blue-700/30">
            <h3 className="text-sm font-medium text-blue-400 mb-2">Active Jobs</h3>
            <p className="text-4xl font-bold text-white">—</p>
            <p className="text-xs text-gray-400 mt-2">Live job tracking coming soon</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/30 to-gray-800 rounded-xl p-6 border border-yellow-700/30">
            <h3 className="text-sm font-medium text-yellow-400 mb-2">Pending Invoices</h3>
            <p className="text-4xl font-bold text-white">—</p>
            <p className="text-xs text-gray-400 mt-2">Payment tracking coming soon</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/30 to-gray-800 rounded-xl p-6 border border-green-700/30">
            <h3 className="text-sm font-medium text-green-400 mb-2">Today's Revenue</h3>
            <p className="text-4xl font-bold text-white">—</p>
            <p className="text-xs text-gray-400 mt-2">Analytics coming soon</p>
          </div>
        </div>

      </div>
    </div>
  );
}
