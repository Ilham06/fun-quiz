'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return

    setError('')
    setLoading(true)

    const res = await fetch(`/api/sessions/by-code/${trimmed}`)
    if (res.ok) {
      router.push(`/quiz/${trimmed}`)
    } else {
      setError('Kode tidak ditemukan. Cek kembali kodenya ya!')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="text-white font-bold text-lg">Fun Quiz</span>
        </div>
        <Link
          href="/login"
          className="text-white/70 hover:text-white text-sm transition-colors"
        >
          Login Pengajar →
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-black text-white mb-3">
              Bergabung Yuk! 🎉
            </h1>
            <p className="text-white/70 text-lg">
              Masukkan kode dari pengajarmu untuk mulai
            </p>
          </div>

          <form
            onSubmit={handleJoin}
            className="bg-white rounded-3xl shadow-2xl p-8 space-y-4"
          >
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-semibold text-gray-600 mb-2 text-center uppercase tracking-widest"
              >
                Kode Sesi
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
                autoComplete="off"
                className="w-full text-center text-4xl font-mono font-black tracking-[0.3em] px-4 py-5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-violet-500 text-gray-900 uppercase"
                placeholder="XXXXXX"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length < 4}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xl font-bold py-4 px-4 rounded-2xl transition-all active:scale-95"
            >
              {loading ? 'Mencari...' : 'Masuk Sekarang →'}
            </button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Tidak perlu login. Langsung masuk!
          </p>
        </div>
      </main>

      <footer className="px-6 pb-6 text-center text-white/30 text-xs">
        Fun Quiz — Platform quiz interaktif untuk pengajar
      </footer>
    </div>
  )
}
