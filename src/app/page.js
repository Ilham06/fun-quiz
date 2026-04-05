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
      setError('Kode tidak ditemukan. Cek kembali!')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#141005] flex flex-col overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-yellow-600/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-yellow-400 rounded-full opacity-60" />
        <div className="absolute top-1/5 right-1/3 w-2 h-2 bg-orange-400 rounded-full opacity-40" />
        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-emerald-400 rounded-full opacity-30" />
      </div>

      <header className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-500/25">
            Q
          </div>
          <span className="text-white font-bold text-lg tracking-tight">funquiz</span>
        </div>
        <Link
          href="/login"
          className="text-white/50 hover:text-white/80 text-sm transition-colors font-medium"
        >
          Pengajar
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Masuk ke<br />
              <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                Sesi Quiz
              </span>
            </h1>
            <p className="text-white/40 mt-3 text-sm">
              Minta kode 6 huruf dari pengajarmu
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setError('')
                }}
                maxLength={6}
                required
                autoComplete="off"
                spellCheck="false"
                className="w-full text-center text-3xl font-mono font-black tracking-[0.4em] px-4 py-5 rounded-2xl bg-white/10 border-2 border-white/10 focus:border-amber-400 focus:outline-none focus:bg-white/15 text-white placeholder:text-white/20 transition-all"
                placeholder="······"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center animate-fade-up">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length < 4}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-30 disabled:hover:from-amber-500 disabled:hover:to-yellow-500 text-white text-lg font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mencari...
                </span>
              ) : (
                'Bergabung'
              )}
            </button>
          </form>

          <p className="text-center text-white/25 text-xs mt-8">
            Tanpa login, tanpa ribet.
          </p>
        </div>
      </main>
    </div>
  )
}
