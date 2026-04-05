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
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col overflow-hidden relative text-white">

      {/* Decorative background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Yellow glow top-right */}
        <div className="absolute -top-24 -right-12 w-[350px] h-[350px] rounded-full bg-[#ffdd00]/[0.12] blur-[80px]" />
        {/* Yellow glow bottom-left */}
        <div className="absolute -bottom-32 -left-20 w-[400px] h-[400px] rounded-full bg-[#ffdd00]/[0.08] blur-[100px]" />

        {/* Floating ring top-left */}
        <div
          className="animate-float-shape absolute top-[15%] left-[10%] w-24 h-24 rounded-full border-[12px] border-[#ffdd00]/30 opacity-40"
          style={{ animationDelay: '0s' }}
        />
        {/* Floating ring bottom-left (purple accent) */}
        <div
          className="animate-float-shape-slow absolute bottom-[20%] left-[15%] w-28 h-28 rounded-full border-[14px] border-purple-500/25 opacity-40"
          style={{ animationDelay: '1s' }}
        />
        {/* Floating triangle bottom-right */}
        <div
          className="animate-float-shape-fast absolute bottom-[15%] right-[14%] opacity-30"
          style={{ animationDelay: '2s' }}
        >
          <svg width="60" height="52" viewBox="0 0 60 52" fill="none">
            <polygon points="30,0 60,52 0,52" fill="rgba(255,221,0,0.4)" />
          </svg>
        </div>

        {/* Small dots cluster */}
        <div className="absolute top-[38%] right-[6%] opacity-15">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="#ffdd00" />
            </pattern>
            <rect width="80" height="80" fill="url(#dots)" />
          </svg>
        </div>

        {/* Small accent dot */}
        <div className="absolute top-[25%] right-[30%] w-3 h-3 bg-emerald-400 rounded-full opacity-40 animate-float-shape" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[60%] left-[8%] w-2 h-2 bg-pink-400 rounded-full opacity-30 animate-float-shape-fast" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#ffdd00] rounded-full flex items-center justify-center shadow-lg shadow-[#ffdd00]/25">
            <svg className="h-5 w-5 text-[#0a0e1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">funquiz</span>
        </div>
        <Link
          href="/login"
          className="text-white/50 hover:text-[#ffdd00] text-sm sm:text-base font-medium transition-colors"
        >
          Pengajar
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-[#ffdd00] leading-tight text-glow-yellow">
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
                className="code-box w-12 h-16 sm:w-[60px] sm:h-[78px] text-center text-2xl sm:text-3xl font-black text-[#ffdd00] bg-[#ffdd00]/5 border-2 border-[#ffdd00]/60 rounded-xl focus:border-[#ffdd00] focus:bg-[#ffdd00]/10 focus:outline-none transition-all placeholder:text-white/10 uppercase"
                placeholder="·"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center animate-fade-up">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.trim().length < 4}
            className="btn-glow w-full max-w-sm bg-[#ffdd00] hover:bg-[#ffe640] disabled:opacity-30 disabled:hover:bg-[#ffdd00] text-[#0a0e1a] text-xl sm:text-2xl font-extrabold py-4 sm:py-5 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-wide"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-[#0a0e1a]/30 border-t-[#0a0e1a] rounded-full animate-spin" />
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
