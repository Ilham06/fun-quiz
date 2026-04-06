'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function RolesPage() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', label: '', permission_ids: [] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/roles').then(r => r.json()),
      fetch('/api/permissions').then(r => r.json()),
    ]).then(([r, p]) => {
      setRoles(Array.isArray(r) ? r : [])
      setPermissions(Array.isArray(p) ? p : [])
      setLoading(false)
    })
  }, [])

  const permGroups = permissions.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = []
    acc[p.group].push(p)
    return acc
  }, {})

  function togglePerm(pid) {
    setForm(f => ({
      ...f,
      permission_ids: f.permission_ids.includes(pid)
        ? f.permission_ids.filter(id => id !== pid)
        : [...f.permission_ids, pid],
    }))
  }

  function startEdit(role) {
    setEditingId(role.id)
    setForm({
      name: role.name,
      label: role.label,
      permission_ids: role.permissions.map(rp => rp.permission.id),
    })
    setShowForm(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm({ name: '', label: '', permission_ids: [] })
    setShowForm(false)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (editingId) {
      const res = await fetch(`/api/roles/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: form.label, permission_ids: form.permission_ids }),
      })
      if (res.ok) {
        const updated = await res.json()
        setRoles(prev => prev.map(r => r.id === editingId ? updated : r))
        resetForm()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal mengupdate role.')
      }
    } else {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const role = await res.json()
        setRoles(prev => [...prev, role])
        resetForm()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal membuat role.')
      }
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Hapus role ini?')) return
    const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRoles(prev => prev.filter(r => r.id !== id))
    } else {
      const data = await res.json()
      alert(data.error || 'Gagal menghapus role.')
    }
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
          <span className="text-gray-900 font-bold uppercase tracking-wider">Kelola Role</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-10 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900">Role & Permission</h1>
          <button
            onClick={() => { showForm ? resetForm() : setShowForm(true) }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors"
          >
            {showForm ? 'Batal' : '＋ Tambah Role'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-200 space-y-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Nama (kode)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="CUSTOM_ROLE"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:outline-none text-gray-900 disabled:opacity-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Label</label>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Nama tampilan"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:outline-none text-gray-900"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Permissions</p>
              <div className="space-y-4">
                {Object.entries(permGroups).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-xs font-bold text-gray-400 mb-2">{group}</p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map(p => {
                        const active = form.permission_ids.includes(p.id)
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePerm(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              active
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {saving ? 'Menyimpan...' : editingId ? 'Update Role' : 'Buat Role'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900">{role.label}</h3>
                    <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{role.name}</span>
                    {role.is_system && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Sistem</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{role._count?.users || 0} pengguna</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(role)}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Edit
                  </button>
                  {!role.is_system && (
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map(rp => (
                  <span key={rp.permission.id} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-[10px] font-semibold rounded-full border border-gray-100">
                    {rp.permission.label}
                  </span>
                ))}
                {role.permissions.length === 0 && (
                  <span className="text-xs text-gray-400">Tidak ada permission</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
