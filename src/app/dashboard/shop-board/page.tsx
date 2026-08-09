'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import JobCardModal from '@/components/JobCardModal';

interface Job {
  id: string;
  status: string;
  priority: string;
  requestedService: string;
  customer: { firstName: string; lastName: string; phone: string };
  vehicle: { registration: string; make: string; model: string };
  mechanic: { name: string } | null;
}

export default function ShopBoardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // State for the "Waiting on Parts" prompt
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [partNote, setPartNote] = useState('');
  const [noteError, setNoteError] = useState('');

  // State for the Job Card Comments modal
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // State for the NEW Job Completion modal
  const [completingJobId, setCompletingJobId] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState({
    laborHours: '',
    laborRate: '100', // Default shop rate
    notes: '',
    parts: [{ partName: '', quantity: 1, unitCost: '' }]
  });
  const [completionError, setCompletionError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchJobs = useCallback(() => {
    if (status === 'authenticated') {
      fetch('/api/jobs')
        .then((res) => res.json())
        .then((data) => {
          setJobs(data);
          setLoading(false);
        })
        .catch((err) => console.error('Failed to fetch jobs:', err));
    }
  }, [status]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Function to handle status change logic
  const handleStatusClick = (jobId: string, nextStatus: string) => {
    if (nextStatus === 'WAITING_ON_PARTS') {
      setPendingJobId(jobId);
      setPartNote('');
      setNoteError('');
    } else if (nextStatus === 'COMPLETED') {
      // Open the completion modal instead of updating immediately
      setCompletingJobId(jobId);
      setCompletionData({
        laborHours: '',
        laborRate: '100',
        notes: '',
        parts: [{ partName: '', quantity: 1, unitCost: '' }]
      });
      setCompletionError('');
    } else {
      updateJobStatus(jobId, nextStatus, '');
    }
  };

  // Function to actually call the API
  const updateJobStatus = async (jobId: string, newStatus: string, note: string, completion?: any) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, note, completionData: completion }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update job status');
      }

      // Reset all prompt states and refresh board
      setPendingJobId(null);
      setPartNote('');
      setCompletingJobId(null);
      setCompletionError('');
      fetchJobs();
    } catch (error: any) {
      if (newStatus === 'WAITING_ON_PARTS') setNoteError(error.message);
      else if (newStatus === 'COMPLETED') setCompletionError(error.message);
      else console.error(error);
    }
  };

  // Handlers for Completion Modal Parts List
  const handleAddPart = () => {
    setCompletionData(prev => ({
      ...prev,
      parts: [...prev.parts, { partName: '', quantity: 1, unitCost: '' }]
    }));
  };

  const handleRemovePart = (index: number) => {
    setCompletionData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const handlePartChange = (index: number, field: string, value: string | number) => {
    setCompletionData(prev => {
      const newParts = [...prev.parts];
      newParts[index] = { ...newParts[index], [field]: value };
      return { ...prev, parts: newParts };
    });
  };

  const submitCompletion = () => {
    if (!completionData.laborHours || parseFloat(completionData.laborHours) <= 0) {
      setCompletionError('Labor hours must be greater than 0.');
      return;
    }
    if (!completionData.laborRate || parseFloat(completionData.laborRate) <= 0) {
      setCompletionError('Labor rate must be greater than 0.');
      return;
    }
    updateJobStatus(completingJobId!, 'COMPLETED', '', completionData);
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Shop Board...</div>;
  }

  const getJobsByStatus = (status: string) => jobs.filter((job) => job.status === status);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      default: return 'bg-gray-600 text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mechanic Shop Board</h1>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KanbanColumn title="To Do" count={getJobsByStatus('SCHEDULED').length}>
            {getJobsByStatus('SCHEDULED').map((job) => (
              <JobCard key={job.id} job={job} priorityBadge={getPriorityBadge(job.priority)} onStatusClick={handleStatusClick} onCardClick={setSelectedJobId} />
            ))}
          </KanbanColumn>

          <KanbanColumn title="In Progress" count={getJobsByStatus('IN_PROGRESS').length}>
            {getJobsByStatus('IN_PROGRESS').map((job) => (
              <JobCard key={job.id} job={job} priorityBadge={getPriorityBadge(job.priority)} onStatusClick={handleStatusClick} onCardClick={setSelectedJobId} />
            ))}
          </KanbanColumn>

          <KanbanColumn title="Waiting on Parts" count={getJobsByStatus('WAITING_ON_PARTS').length}>
            {getJobsByStatus('WAITING_ON_PARTS').map((job) => (
              <JobCard key={job.id} job={job} priorityBadge={getPriorityBadge(job.priority)} onStatusClick={handleStatusClick} onCardClick={setSelectedJobId} />
            ))}
          </KanbanColumn>

          <KanbanColumn title="Completed" count={getJobsByStatus('COMPLETED').length}>
            {getJobsByStatus('COMPLETED').map((job) => (
              <JobCard key={job.id} job={job} priorityBadge={getPriorityBadge(job.priority)} onStatusClick={handleStatusClick} onCardClick={setSelectedJobId} />
            ))}
          </KanbanColumn>
        </div>
      </div>

      {/* Global Modal for "Waiting on Parts" Note */}
      {pendingJobId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-600 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-yellow-500 mb-2">⚠️ Waiting on Parts</h3>
            <p className="text-gray-300 text-sm mb-4">Please specify which parts are needed before moving this job.</p>

            {noteError && (
              <div className="mb-4 bg-red-500/20 border border-red-500 text-red-400 px-3 py-2 rounded text-sm">
                {noteError}
              </div>
            )}

            <textarea
              value={partNote}
              onChange={(e) => setPartNote(e.target.value)}
              placeholder="e.g., Need 1x Alternator (Remanufactured) and 1x Serpentine Belt"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:outline-none mb-4"
              rows={3}
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setPendingJobId(null); setPartNote(''); setNoteError(''); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => updateJobStatus(pendingJobId, 'WAITING_ON_PARTS', partNote)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition"
              >
                Confirm & Move Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modal for Job Completion (NEW) */}
      {completingJobId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl border border-gray-600 p-6 max-w-2xl w-full shadow-2xl my-8">
            <h3 className="text-xl font-bold text-green-500 mb-2">✅ Complete Job & Log Details</h3>
            <p className="text-gray-300 text-sm mb-4">Log the labor, parts, and costs before finalizing this job. This will send it to the Billing queue.</p>

            {completionError && (
              <div className="mb-4 bg-red-500/20 border border-red-500 text-red-400 px-3 py-2 rounded text-sm">
                {completionError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Labor Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={completionData.laborHours}
                  onChange={(e) => setCompletionData({...completionData, laborHours: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="e.g. 2.5"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Labor Rate ($/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={completionData.laborRate}
                  onChange={(e) => setCompletionData({...completionData, laborRate: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="e.g. 100"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-gray-400">Parts Used</label>
                <button type="button" onClick={handleAddPart} className="text-xs text-green-400 hover:text-green-300 font-semibold">+ Add Part</button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {completionData.parts.map((part, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Part Name"
                      value={part.partName}
                      onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                      className="col-span-6 px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={part.quantity}
                      onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                      className="col-span-2 px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Cost"
                      step="0.01"
                      min="0"
                      value={part.unitCost}
                      onChange={(e) => handlePartChange(index, 'unitCost', e.target.value)}
                      className="col-span-3 px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="col-span-1 text-red-400 hover:text-red-300 text-xl leading-none"
                      disabled={completionData.parts.length === 1}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Final Notes (Optional)</label>
              <textarea
                value={completionData.notes}
                onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                placeholder="e.g. Replaced front brake pads and rotors. Fluid topped off."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none"
                rows={2}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setCompletingJobId(null); setCompletionError(''); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={submitCompletion}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
              >
                Confirm & Complete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedJobId && (
        <JobCardModal
          appointmentId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </div>
  );
}

function KanbanColumn({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 min-h-[500px]">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">{count}</span>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function JobCard({ job, priorityBadge, onStatusClick, onCardClick }: { job: Job; priorityBadge: string; onStatusClick: (id: string, status: string) => void; onCardClick: (id: string) => void }) {

  const getNextStatus = () => {
    switch (job.status) {
      case 'SCHEDULED': return 'IN_PROGRESS';
      case 'IN_PROGRESS': return 'WAITING_ON_PARTS';
      case 'WAITING_ON_PARTS': return 'IN_PROGRESS';
      case 'COMPLETED': return 'SCHEDULED';
      default: return 'SCHEDULED';
    }
  };

  return (
    <div
      className="bg-gray-700 rounded-lg p-4 border border-gray-600 shadow-md cursor-pointer"
      onClick={() => onCardClick(job.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-bold px-2 py-1 rounded ${priorityBadge}`}>
          {job.priority}
        </span>
        <span className="text-xs text-gray-400">{job.vehicle.registration}</span>
      </div>

      <h3 className="font-bold text-lg mb-1">{job.vehicle.make} {job.vehicle.model}</h3>
      <p className="text-sm text-gray-300 mb-3">{job.requestedService}</p>

      <div className="text-xs text-gray-400 border-t border-gray-600 pt-2 mt-2 mb-4">
        <p>👤 {job.customer.firstName} {job.customer.lastName}</p>
        <p>🔧 {job.mechanic?.name || 'Unassigned'}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {job.status !== 'COMPLETED' && (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusClick(job.id, getNextStatus()); }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded transition-colors"
          >
            {job.status === 'SCHEDULED' ? 'Start Job' : 'Move Next'}
          </button>
        )}

        {job.status === 'IN_PROGRESS' && (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusClick(job.id, 'COMPLETED'); }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-3 rounded transition-colors"
          >
            Complete
          </button>
        )}

        {job.status === 'WAITING_ON_PARTS' && (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusClick(job.id, 'IN_PROGRESS'); }}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold py-2 px-3 rounded transition-colors"
          >
            Resume
          </button>
        )}
      </div>
    </div>
  );
}
