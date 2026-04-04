'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-xs text-white/30 hover:text-red-400 disabled:opacity-50 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 font-medium"
    >
      {loading ? 'Keluar...' : 'Keluar'}
    </button>
  )
}
