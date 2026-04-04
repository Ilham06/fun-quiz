'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SessionControls({ sessionId, initialActive }) {
  const [isActive, setIsActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggleActive() {
    setLoading(true)
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    if (res.ok) setIsActive((v) => !v)
    setLoading(false)
  }

  async function deleteSession() {
    if (!confirm('Hapus sesi ini beserta semua data?')) return
    setLoading(true)
    const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    if (res.ok) router.push('/dashboard')
    else setLoading(false)
  }

  return (
    <div className="flex gap-2 items-center shrink-0">
      <button
        onClick={toggleActive}
        disabled={loading}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
            : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
        }`}
      >
        {isActive ? '● LIVE' : '○ Nonaktif'}
      </button>
      <button
        onClick={deleteSession}
        disabled={loading}
        className="px-3 py-2 rounded-xl text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        Hapus
      </button>
    </div>
  )
}
