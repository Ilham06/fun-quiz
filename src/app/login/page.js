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
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center relative text-gray-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-amber-500/[0.12] blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-400/[0.08] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-amber-500/25">
              Q
            </div>
            <span className="text-gray-600 font-bold text-sm group-hover:text-gray-900 transition-colors">funquiz</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Login Pengajar</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola sesi quiz dan feedback</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-gray-900 placeholder:text-gray-400 transition-colors"
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-gray-900 placeholder:text-gray-400 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm animate-fade-up">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-6">
          <Link href="/" className="hover:text-gray-600 transition-colors">
            Kembali ke halaman utama
          </Link>
        </p>
      </div>
    </div>
  )
}
