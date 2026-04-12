'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', name: '', role_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/roles').then(r => r.json()),
    ]).then(([u, r]) => {
      setUsers(Array.isArray(u) ? u : [])
      setRoles(Array.isArray(r) ? r : [])
      setLoading(false)
    })
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const user = await res.json()
      setUsers(prev => [user, ...prev])
      setForm({ username: '', password: '', name: '', role_id: '' })
      setShowForm(false)
    } else {
      const data = await res.json()
      setError(data.error || 'Gagal membuat user.')
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Hapus user ini?')) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <nav className="w-full bg-white border-b border-gray-100 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-4 text-sm font-medium">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
            Dashboard
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-900 font-bold uppercase tracking-wider">Kelola Pengguna</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-10 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900">Pengguna</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors"
          >
            {showForm ? 'Batal' : '＋ Tambah User'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Nama</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Role</label>
                <select
                  required
                  value={form.role_id}
                  onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:outline-none text-gray-900"
                >
                  <option value="">Pilih role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nama</th>
                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">
                      {u.role?.label || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold transition-colors"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Belum ada user.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
