"use client";

import { useState, useEffect } from "react";

interface Author { name: string | null; }
interface Note { id: string; text: string; createdAt: string; author: Author; }
interface Vehicle { make: string; model: string; year: number; registration: string; }
interface Customer { firstName: string; lastName: string; phone: string; }

interface Appointment {
  id: string;
  requestedService: string;
  status: string;
  priority: string;
  scheduledDateTime: string | null;
  vehicle: Vehicle;
  customer: Customer;
  notes: Note[]; // <-- Added notes array
}

export default function MechanicJobsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // States for managing notes
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/appointments");
        if (res.ok) setAppointments(await res.json());
      } catch (error) { console.error("Failed to fetch jobs:", error); } 
      finally { setLoading(false); }
    };
    fetchJobs();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        const updatedJob = await res.json();
        setAppointments((prev) => prev.map((job) => (job.id === id ? updatedJob : job)));
      }
    } catch (error) { console.error("Failed to update status:", error); } 
    finally { setUpdatingId(null); }
  };

  // NEW: Handle adding a note
  const handleAddNote = async (appointmentId: string) => {
    const text = noteTexts[appointmentId] || "";
    if (!text.trim()) return;

    setSavingNoteId(appointmentId);
    try {
      const res = await fetch("/api/appointments/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, text }),
      });

      if (res.ok) {
        const newNote = await res.json();
        // Add the new note to the specific appointment in the UI
        setAppointments((prev) =>
          prev.map((job) => 
            job.id === appointmentId 
              ? { ...job, notes: [newNote, ...job.notes] } 
              : job
          )
        );
        setNoteTexts((prev) => ({ ...prev, [appointmentId]: "" })); // Clear input
      }
    } catch (error) { console.error("Failed to add note:", error); } 
    finally { setSavingNoteId(null); }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === "HIGH" || priority === "CRITICAL" ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-gray-500 text-lg">Loading your work queue...</p></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Work Queue</h1>
        <p className="text-gray-600 mt-2">Manage your assigned repair jobs and add technical notes.</p>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No jobs assigned to you right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((job) => (
            <div key={job.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
              
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{job.vehicle.make} {job.vehicle.model}</h3>
                  <p className="text-sm text-gray-500">{job.vehicle.year} • {job.vehicle.registration}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(job.priority)}`}>
                  {job.priority}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Customer</p>
                  <p className="text-gray-800">{job.customer.firstName} {job.customer.lastName} ({job.customer.phone})</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Service Requested</p>
                  <p className="text-gray-800">{job.requestedService}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <p className="text-sm text-gray-700">{formatDate(job.scheduledDateTime)}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* NEW: Notes Section */}
              <div className="px-4 pb-4 flex-grow">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Mechanic Notes ({job.notes.length})</p>
                <div className="space-y-2 max-h-32 overflow-y-auto mb-3 pr-1">
                  {job.notes.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No notes added yet.</p>
                  ) : (
                    job.notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                        <p className="text-gray-700 mb-1">{note.text}</p>
                        <p className="text-gray-400 text-[10px]">
                          {note.author.name || 'Mechanic'} • {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Input */}
                <textarea
                  placeholder="Add a technical finding or note..."
                  value={noteTexts[job.id] || ""}
                  onChange={(e) => setNoteTexts({ ...noteTexts, [job.id]: e.target.value })}
                  className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  rows={2}
                />
                <button
                  onClick={() => handleAddNote(job.id)}
                  disabled={savingNoteId === job.id || !noteTexts[job.id]?.trim()}
                  className="mt-2 w-full py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingNoteId === job.id ? "Saving..." : "Save Note"}
                </button>
              </div>

              {/* Card Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                {job.status === "SCHEDULED" && (
                  <button onClick={() => handleStatusChange(job.id, "IN_PROGRESS")} disabled={updatingId === job.id} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50">
                    {updatingId === job.id ? "Starting..." : "Start Job"}
                  </button>
                )}
                {job.status === "IN_PROGRESS" && (
                  <button onClick={() => handleStatusChange(job.id, "COMPLETED")} disabled={updatingId === job.id} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors disabled:opacity-50">
                    {updatingId === job.id ? "Completing..." : "Complete Job"}
                  </button>
                )}
                {job.status === "COMPLETED" && (
                  <div className="text-center text-green-600 font-medium text-sm">✓ Job Completed</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}