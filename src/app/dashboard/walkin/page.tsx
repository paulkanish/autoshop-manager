'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Mechanic {
  id: string;
  name: string;
  role: string;
}

export default function WalkInPage() {
  const { status } = useSession();
  const router = useRouter();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    registration: '',
    make: '',
    model: '',
    issueDescription: '',
    priority: 'HIGH',
    mechanicId: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    
    // Fetch mechanics for the dropdown
    if (status === 'authenticated') {
      fetch('/api/mechanics')
        .then((res) => res.json())
        .then((data) => setMechanics(data))
        .catch((err) => console.error('Failed to fetch mechanics:', err));
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      // Success! Redirect to the shop board to see the new job
      router.push('/dashboard/shop-board');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-500">🚶 New Walk-In Intake</h1>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-6">
          
          {/* Customer Info */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">First Name *</label>
                <input name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Last Name *</label>
                <input name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-600 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number * (Used for quick lookup)</label>
                <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="e.g., 555-0100" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-600 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">Vehicle Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Registration / Plate *</label>
                <input name="registration" required value={formData.registration} onChange={handleChange} placeholder="e.g., ABC-123" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Make *</label>
                <input name="make" required value={formData.make} onChange={handleChange} placeholder="e.g., Toyota" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Model *</label>
                <input name="model" required value={formData.model} onChange={handleChange} placeholder="e.g., Camry" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-600 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">Job Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Issue Description *</label>
                <textarea name="issueDescription" required rows={3} value={formData.issueDescription} onChange={handleChange} placeholder="e.g., Grinding noise when braking, customer is waiting in lobby" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Priority Level</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-600 focus:outline-none">
                  <option value="HIGH">High (Standard Walk-in)</option>
                  <option value="CRITICAL">Critical (Emergency / Towed)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Assign Mechanic *</label>
                <select name="mechanicId" required value={formData.mechanicId} onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-600 focus:outline-none">
                  <option value="">Select a mechanic...</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-700 flex justify-end gap-4">
            <button type="button" onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Creating Job...' : '🚀 Create Job & Add to Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
