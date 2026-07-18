"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Customer { id: string; firstName: string; lastName: string; }
interface Vehicle { id: string; registration: string; make: string; model: string; customerId: string; }
interface Mechanic { id: string; name: string | null; }

interface Props {
  customers: Customer[];
  vehicles: Vehicle[];
  mechanics: Mechanic[];
}

export default function AppointmentForm({ customers, vehicles, mechanics }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    customerId: '',
    vehicleId: '',
    mechanicId: '',
    requestedService: '',
    estimatedDuration: '',
    scheduledDateTime: '',
    priority: 'ROUTINE',
  });

  // Filter vehicles based on selected customer
  const availableVehicles = formData.customerId 
    ? vehicles.filter(v => v.customerId === formData.customerId)
    : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset vehicle if customer changes
      if (name === 'customerId') newData.vehicleId = '';
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create appointment');
      }

      // Redirect to dashboard or appointments list on success
      router.push('/dashboard'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer *</label>
          <select name="customerId" value={formData.customerId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">Select Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </select>
        </div>

        {/* Vehicle Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Vehicle *</label>
          <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} required disabled={!formData.customerId} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100">
            <option value="">Select Vehicle</option>
            {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registration} - {v.make} {v.model}</option>)}
          </select>
        </div>

        {/* Mechanic Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Assign Mechanic</label>
          <select name="mechanicId" value={formData.mechanicId} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">Unassigned</option>
            {mechanics.map(m => <option key={m.id} value={m.id}>{m.name || 'Unknown Mechanic'}</option>)}
          </select>
        </div>

        {/* Priority Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="ROUTINE">Routine</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Service Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Requested Service *</label>
          <input type="text" name="requestedService" value={formData.requestedService} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Oil Change, Brake Inspection" />
        </div>

        {/* Duration Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Estimated Duration</label>
          <input type="text" name="estimatedDuration" value={formData.estimatedDuration} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. 1 hour" />
        </div>

        {/* Date/Time Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Scheduled Date/Time</label>
          <input type="datetime-local" name="scheduledDateTime" value={formData.scheduledDateTime} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Appointment'}
        </button>
      </div>
    </form>
  );
}
