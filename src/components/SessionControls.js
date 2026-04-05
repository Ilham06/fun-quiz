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
    <div className="flex space-x-3 items-center shrink-0">
      <button
        onClick={toggleActive}
        disabled={loading}
        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 ${
          isActive
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
        }`}
      >
        {isActive && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        <span>{isActive ? 'LIVE' : 'Nonaktif'}</span>
      </button>
      <button
        onClick={deleteSession}
        disabled={loading}
        className="px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-50"
      >
        Hapus
      </button>
    </div>
  )
}
