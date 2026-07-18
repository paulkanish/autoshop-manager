'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Part {
  name: string;
  count: number;
  lastUsed: string;
  lastCost: number;
}

interface Appointment {
  id: string;
  createdAt: string;
  requestedService: string;
  status: string;
  mechanic: { name: string } | null;
  serviceRecord: {
    partsUsed: { partName: string; quantity: number; unitCost: number }[];
  } | null;
}

interface VehicleResult {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number | null;
  customer: { firstName: string; lastName: string; phone: string };
  appointments: Appointment[];
  aggregatedParts: Part[];
}

export default function VehicleHistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VehicleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/vehicles/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Vehicle History & Parts Lookup</h1>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
            Back to Dashboard
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by License Plate (e.g., ABC-123) or Phone Number (e.g., 555-0100)"
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Results Area */}
        {searched && results.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400 bg-gray-800 rounded-xl border border-gray-700">
            No vehicles found matching "{query}". Try a different plate or phone number.
          </div>
        )}

        {results.map((vehicle) => (
          <div key={vehicle.id} className="mb-12 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            
            {/* Vehicle Header */}
            <div className="bg-gray-700 p-6 border-b border-gray-600">
              <h2 className="text-2xl font-bold text-white">
                {vehicle.year} {vehicle.make} {vehicle.model} 
                <span className="ml-4 text-lg font-normal text-gray-300">({vehicle.registration})</span>
              </h2>
              <p className="text-gray-300 mt-1">
                Owner: {vehicle.customer.firstName} {vehicle.customer.lastName} | Phone: {vehicle.customer.phone}
              </p>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Service Timeline */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-red-500 border-b border-gray-700 pb-2">Service History</h3>
                {vehicle.appointments.length === 0 ? (
                  <p className="text-gray-400">No service records found.</p>
                ) : (
                  <div className="space-y-4">
                    {vehicle.appointments.map((appt) => (
                      <div key={appt.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-400">
                            {new Date(appt.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${
                            appt.status === 'COMPLETED' ? 'bg-green-900 text-green-200' : 
                            appt.status === 'IN_PROGRESS' ? 'bg-blue-900 text-blue-200' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {appt.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-medium text-white mb-1">{appt.requestedService}</p>
                        <p className="text-xs text-gray-400">Mechanic: {appt.mechanic?.name || 'Unassigned'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Parts Previously Used */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-yellow-500 border-b border-gray-700 pb-2">
                  ️ Parts Previously Used
                </h3>
                {vehicle.aggregatedParts.length === 0 ? (
                  <p className="text-gray-400">No parts logged for this vehicle yet.</p>
                ) : (
                  <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-800 text-gray-400">
                        <tr>
                          <th className="p-3">Part Name</th>
                          <th className="p-3">Times Used</th>
                          <th className="p-3">Last Cost</th>
                          <th className="p-3">Last Used</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {vehicle.aggregatedParts.map((part, idx) => (
                          <tr key={idx} className="hover:bg-gray-800 transition-colors">
                            <td className="p-3 font-medium text-white">{part.name}</td>
                            <td className="p-3 text-gray-300">{part.count}</td>
                            <td className="p-3 text-green-400">${part.lastCost.toFixed(2)}</td>
                            <td className="p-3 text-gray-400">{new Date(part.lastUsed).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
