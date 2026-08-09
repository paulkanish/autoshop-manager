'use client';

import { useEffect, useState } from 'react';

type Role = 'ADMIN' | 'MECHANIC' | 'OWNER';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  MECHANIC: 'bg-blue-100 text-blue-800',
  OWNER: 'bg-green-100 text-green-800',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MECHANIC' as Role });
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function load() {
    const res = await fetch('/api/users');
    if (res.ok) setUsers((await res.json()).users);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (res.ok) {
      setMsg({ type: 'success', text: `User "${data.user.name}" created as ${data.user.role}. They can log in now.` });
      setForm({ name: '', email: '', password: '', role: 'MECHANIC' });
      load();
    } else {
      setMsg({ type: 'error', text: data.error ?? 'Something went wrong.' });
    }
    setPending(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create user */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Create New User</h2>

            {msg && (
              <div
                className={`mb-4 p-3 rounded border text-sm ${
                  msg.type === 'success'
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : 'bg-red-100 border-red-400 text-red-700'
                }`}
              >
                {msg.text}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Marcus Bay"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (login)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="mechanic2@autoshop.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password (min 8 characters)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MECHANIC">Mechanic</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
              >
                {pending ? 'Creating…' : 'Create User'}
              </button>
            </form>
          </div>

          {/* Existing users */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Existing Users ({users.length})</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{u.name}</td>
                    <td className="py-2 text-gray-600">{u.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
