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
    if (res.ok) {
      setIsActive((v) => !v)
    }
    setLoading(false)
  }

  async function deleteSession() {
    if (!confirm('Hapus sesi ini beserta semua pertanyaan dan jawaban?')) return
    setLoading(true)
    const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={toggleActive}
        disabled={loading}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
          isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {isActive ? '🟢 Aktif' : '⚫ Nonaktif'}
      </button>
      <button
        onClick={deleteSession}
        disabled={loading}
        className="px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        Hapus
      </button>
    </div>
  )
}
