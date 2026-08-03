'use client';

import { useEffect, useState } from 'react';

type Author = {
  id: string;
  name: string;
  role: string;
};

type Note = {
  id: string;
  text: string;
  createdAt: string;
  author: Author;
};

type JobCardModalProps = {
  appointmentId: string;
  jobLabel?: string; // e.g. vehicle registration or customer name, for the header
  onClose: () => void;
};

export default function JobCardModal({
  appointmentId,
  jobLabel,
  onClose,
}: JobCardModalProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/notes`);
        if (!res.ok) {
          throw new Error('Failed to load comments');
        }
        const data = await res.json();
        if (!cancelled) {
          setNotes(data.notes ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load comments. Try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotes();
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || posting) return;

    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        throw new Error('Failed to post comment');
      }
      const data = await res.json();
      setNotes((prev) => [...prev, data.note]);
      setDraft('');
    } catch (err) {
      setError('Could not post comment. Try again.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-800">
            {jobLabel ? `Comments — ${jobLabel}` : 'Job Comments'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading && <p className="text-sm text-gray-500">Loading comments…</p>}
          {!loading && notes.length === 0 && !error && (
            <p className="text-sm text-gray-500">No comments yet.</p>
          )}
          {notes.map((note) => (
            <div key={note.id} className="border rounded-md p-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="font-medium text-gray-700">
                  {note.author?.name ?? 'Unknown'} ({note.author?.role})
                </span>
                <span>{new Date(note.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p>
            </div>
          ))}
        </div>

        {error && (
          <p className="px-4 text-sm text-red-600">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="border-t px-4 py-3 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={posting}
          />
          <button
            type="submit"
            disabled={posting || !draft.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
