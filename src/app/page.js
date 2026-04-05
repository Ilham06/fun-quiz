'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])

  const code = digits.join('')

  const handleDigitChange = useCallback((index, value) => {
    const char = value.slice(-1).toUpperCase()
    if (char && !/[A-Z0-9]/.test(char)) return

    setDigits(prev => {
      const next = [...prev]
      next[index] = char
      return next
    })
    setError('')

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [])

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }, [digits])

  const handlePaste = useCallback((e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().slice(0, 6)
    if (!pasted) return
    const chars = pasted.split('').filter(c => /[A-Z0-9]/.test(c))
    setDigits(prev => {
      const next = [...prev]
      chars.forEach((c, i) => { if (i < 6) next[i] = c })
      return next
    })
    const focusIdx = Math.min(chars.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }, [])

  async function handleJoin(e) {
    e.preventDefault()
    const trimmed = code.trim()
    if (trimmed.length < 4) return

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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col overflow-hidden relative text-gray-900">

      {/* Decorative background shapes — subtle amber on light */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-12 w-[350px] h-[350px] rounded-full bg-amber-500/[0.08] blur-[80px]" />
        <div className="absolute -bottom-32 -left-20 w-[400px] h-[400px] rounded-full bg-amber-500/[0.06] blur-[100px]" />

        <div
          className="animate-float-shape absolute top-[15%] left-[10%] w-24 h-24 rounded-full border-[12px] border-amber-500/20 opacity-60"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="animate-float-shape-slow absolute bottom-[20%] left-[15%] w-28 h-28 rounded-full border-[14px] border-amber-400/15 opacity-50"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="animate-float-shape-fast absolute bottom-[15%] right-[14%] opacity-40"
          style={{ animationDelay: '2s' }}
        >
          <svg width="60" height="52" viewBox="0 0 60 52" fill="none">
            <polygon points="30,0 60,52 0,52" fill="rgba(245, 158, 11, 0.18)" />
          </svg>
        </div>

        <div className="absolute top-[38%] right-[6%] opacity-[0.12]">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="#f59e0b" />
            </pattern>
            <rect width="80" height="80" fill="url(#dots)" />
          </svg>
        </div>

        <div className="absolute top-[25%] right-[30%] w-3 h-3 bg-amber-400/50 rounded-full animate-float-shape" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[60%] left-[8%] w-2 h-2 bg-amber-300/40 rounded-full animate-float-shape-fast" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/25">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">funquiz</span>
        </div>
        <Link
          href="/login"
          className="text-gray-500 hover:text-amber-600 text-sm sm:text-base font-medium transition-colors"
        >
          Pengajar
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight bg-gradient-to-br from-amber-500 to-amber-600 bg-clip-text text-transparent">
            Siap untuk<br />Tantangan?
          </h1>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col items-center gap-7 w-full max-w-lg">
          {/* 6-box code input */}
          <div className="flex gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="text"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                autoComplete="off"
                spellCheck="false"
                className="code-box w-12 h-16 sm:w-[60px] sm:h-[78px] text-center text-2xl sm:text-3xl font-black text-gray-900 bg-white border-2 border-amber-500/50 rounded-xl shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white focus:outline-none transition-all placeholder:text-gray-400 uppercase"
                placeholder="·"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center animate-fade-up">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.trim().length < 4}
            className="btn-glow w-full max-w-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:hover:bg-amber-500 text-white text-xl sm:text-2xl font-extrabold py-4 sm:py-5 rounded-2xl shadow-md shadow-amber-500/20 transition-all active:scale-[0.98] uppercase tracking-wide"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mencari...
              </span>
            ) : (
              'Bergabung'
            )}
          </button>

          <p className="text-gray-400 text-sm font-medium tracking-wide">
            Tanpa login, langsung gabung!
          </p>
        </form>
      </main>
    </div>
  )
}
