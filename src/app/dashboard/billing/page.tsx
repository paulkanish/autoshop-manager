'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface PendingJob {
  id: string;
  requestedService: string;
  vehicle: { registration: string; make: string; model: string };
  customer: { firstName: string; lastName: string; phone: string };
  serviceRecord: {
    id: string;
    laborHours: number;
    laborRate: number;
    partsUsed: { partName: string; quantity: number; unitCost: number }[];
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paymentStatus: string;
  paymentDate: string | null;
  serviceRecord: {
    appointment: {
      vehicle: { registration: string; make: string; model: string };
      customer: { firstName: string; lastName: string };
    };
  };
}

export default function BillingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (status === 'authenticated') {
      try {
        const res = await fetch('/api/billing');
        const data = await res.json();
        setPendingJobs(data.pendingJobs || []);
        setInvoices(data.invoices || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    fetchData();
  }, [status, router]);

  const generateInvoice = async (appointmentId: string) => {
    if (!confirm('Generate invoice for this job?')) return;
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      if (res.ok) fetchData();
      else alert('Failed to generate invoice');
    } catch (err) {
      alert('Error generating invoice');
    }
  };

  const updateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/billing/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (res.ok) fetchData();
      else alert('Failed to update status');
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Billing...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Invoicing & Billing</h1>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
            Back to Dashboard
          </button>
        </div>

        {/* Section 1: Pending Invoices (Completed Jobs) */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-500">Ready to Invoice ({pendingJobs.length})</h2>
          {pendingJobs.length === 0 ? (
            <p className="text-gray-400 bg-gray-800 p-6 rounded-lg border border-gray-700">No completed jobs waiting for invoicing.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingJobs.map((job) => {
                const laborTotal = job.serviceRecord.laborHours * job.serviceRecord.laborRate;
                const partsTotal = job.serviceRecord.partsUsed.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);
                const total = laborTotal + partsTotal;

                return (
                  <div key={job.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg">{job.vehicle.make} {job.vehicle.model}</h3>
                      <p className="text-sm text-gray-400">{job.vehicle.registration} | {job.customer.firstName} {job.customer.lastName}</p>
                    </div>
                    <p className="text-sm text-gray-300 mb-4 flex-grow">{job.requestedService}</p>

                    <div className="bg-gray-900 p-3 rounded-lg mb-4 text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-gray-400">Labor ({job.serviceRecord.laborHours}h)</span><span>${laborTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Parts</span><span>${partsTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-white border-t border-gray-700 pt-1 mt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
                    </div>

                    <button
                      onClick={() => generateInvoice(job.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition"
                    >
                      Generate Invoice
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Invoice History */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-blue-500">Invoice History</h2>
          {invoices.length === 0 ? (
            <p className="text-gray-400 bg-gray-800 p-6 rounded-lg border border-gray-700">No invoices generated yet.</p>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-700 text-gray-300">
                  <tr>
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Customer / Vehicle</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-750">
                      <td className="p-4 font-mono font-bold">{inv.invoiceNumber}</td>
                      <td className="p-4">
                        <div className="font-medium">{inv.serviceRecord.appointment.customer.firstName} {inv.serviceRecord.appointment.customer.lastName}</div>
                        <div className="text-sm text-gray-400">{inv.serviceRecord.appointment.vehicle.make} {inv.serviceRecord.appointment.vehicle.registration}</div>
                      </td>
                      <td className="p-4 font-bold text-green-400">${inv.totalAmount.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          inv.paymentStatus === 'PAID' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        {inv.paymentStatus === 'PENDING' ? (
                          <button
                            onClick={() => updateStatus(inv.id, 'PAID')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition"
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => updateStatus(inv.id, 'PENDING')}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold rounded transition"
                          >
                            Unmark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
