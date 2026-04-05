'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const username = formData.get('username')
    const password = formData.get('password')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json()
      setError(data.error || 'Login gagal.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#141005] flex items-center justify-center relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-yellow-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-amber-500/25">
              Q
            </div>
            <span className="text-white/60 font-bold text-sm group-hover:text-white/80 transition-colors">funquiz</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Login Pengajar</h1>
          <p className="text-white/40 text-sm mt-1">Kelola sesi quiz dan feedback</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-400 focus:outline-none text-white placeholder:text-white/25 transition-colors"
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-400 focus:outline-none text-white placeholder:text-white/25 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm animate-fade-up">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-white/25 text-xs mt-6">
          <Link href="/" className="hover:text-white/50 transition-colors">
            Kembali ke halaman utama
          </Link>
        </p>
      </div>
    </div>
  )
}
