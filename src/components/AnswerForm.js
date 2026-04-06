'use client'
import { useState, useEffect } from 'react'
import { getSocket } from '@/lib/socket'

function AnswerTimer({ timerSeconds, questionId, onExpired }) {
  const [elapsed, setElapsed] = useState(0)
  const timeLeft = Math.max(0, timerSeconds - elapsed)
  const expired = timeLeft === 0

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000)
      setElapsed(secs)
      if (secs >= timerSeconds) clearInterval(interval)
    }, 250)
    return () => clearInterval(interval)
  }, [timerSeconds])

  useEffect(() => {
    if (expired && onExpired) onExpired()
  }, [expired, onExpired])

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className={`font-mono text-xl md:text-2xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-countdown-pulse' : 'text-gray-900'}`}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / timerSeconds) * 100}%` }}
          />
        </div>
      </div>
      {expired && (
        <p className="text-center text-red-500 text-sm font-medium animate-fade-up">Waktu habis!</p>
      )}
    </>
  )
}

export default function AnswerForm({ session, activeQuestion }) {
  const [name, setName] = useState('')
  const [isAnon, setIsAnon] = useState(false)
  const [content, setContent] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [timerExpired, setTimerExpired] = useState(false)

  const timerSeconds = activeQuestion?.timer_seconds || 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const answerContent =
      activeQuestion?.type === 'multiple_choice' && selectedOption !== null
        ? selectedOption
        : content

    if (!answerContent?.trim()) {
      setError('Jawaban tidak boleh kosong.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        question_id: activeQuestion?.id || null,
        student_name: isAnon ? null : name || null,
        content: answerContent,
      }),
    })

    if (res.ok) {
      const answer = await res.json()
      getSocket().emit('new-answer', answer)
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Gagal mengirim.')
    }
    setLoading(false)
  }

  /* ── "Discussion Submission Success" state ── */
  if (submitted) {
    return (
      <div className="animate-fade-up">
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl md:rounded-3xl p-6 md:p-10 flex flex-col items-center justify-center text-center shadow-[0px_20px_50px_rgba(245,158,11,0.2)]">
          <div className="mb-4 md:mb-6 relative">
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
            <div className="relative bg-white text-amber-600 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 md:w-12 md:h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
          <h2 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight mb-1.5">Terkirim!</h2>
          <p className="text-white/90 text-sm md:text-base font-medium">
            Terima kasih, {isAnon ? 'Anonim' : name || 'teman'}.
          </p>
        </div>
      </div>
    )
  }

  /* ── "Premium Discussion Input" form ── */
  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {timerSeconds > 0 && (
        <AnswerTimer
          key={activeQuestion?.id}
          timerSeconds={timerSeconds}
          questionId={activeQuestion?.id}
          onExpired={() => setTimerExpired(true)}
        />
      )}

      {/* Name input — stacks toggle below on mobile */}
      <div className="group">
        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider ml-1">
          Identitas
        </label>
        <div className="space-y-2 md:space-y-0">
          <div className="flex items-center bg-gray-50 rounded-xl md:rounded-2xl border-2 border-transparent group-focus-within:border-amber-400 group-focus-within:bg-white transition-all duration-300 overflow-hidden">
            <div className="pl-3 md:pl-4 pr-2 text-amber-500 shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            {!isAnon ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-gray-900 font-medium py-3.5 md:py-4 text-sm md:text-base placeholder:text-gray-400"
                placeholder="Masukkan nama kamu..."
              />
            ) : (
              <span className="flex-1 py-3.5 md:py-4 text-gray-400 font-medium italic text-sm md:text-base">Anonim</span>
            )}
            {/* Toggle inline on md+, always visible */}
            <div className="pr-3 md:pr-4 flex items-center border-l border-gray-200/50 pl-3 md:pl-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsAnon((v) => !v)}
                className={`px-2.5 md:px-3 py-1.5 rounded-full text-[0.65rem] md:text-[0.7rem] font-bold uppercase transition-all whitespace-nowrap ${
                  isAnon
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {isAnon ? '👤 Anonim' : 'Anonim?'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Answer input */}
      {activeQuestion?.type === 'multiple_choice' && activeQuestion.options?.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider ml-1">
            Pilih Jawaban
          </label>
          {activeQuestion.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedOption(opt)}
              disabled={timerExpired}
              className={`w-full text-left px-4 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl border-2 transition-all disabled:opacity-40 ${
                selectedOption === opt
                  ? 'border-amber-500 bg-amber-50 text-gray-900 shadow-sm'
                  : 'border-transparent bg-gray-50 hover:border-amber-300 hover:bg-amber-50/50 text-gray-800'
              }`}
            >
              <span className="font-bold text-gray-400 mr-2 md:mr-3 text-base md:text-lg">{String.fromCharCode(65 + i)}.</span>
              <span className="text-sm md:text-base">{opt}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="group">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider ml-1">
            Jawaban Kamu
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
            disabled={timerExpired}
            maxLength={500}
            className="w-full bg-gray-50 rounded-xl md:rounded-2xl border-2 border-transparent focus:border-amber-400 focus:bg-white focus:ring-0 transition-all duration-300 text-gray-900 font-medium p-4 md:p-5 text-sm md:text-base resize-none placeholder:text-gray-400 disabled:opacity-40"
            placeholder={activeQuestion ? 'Ketik jawaban kamu di sini...' : 'Tulis pesan atau jawabanmu...'}
          />
        </div>
      )}

      {error && <p className="text-red-500 text-sm animate-fade-up">{error}</p>}

      {/* Gradient submit button — large touch target */}
      <button
        type="submit"
        disabled={loading || timerExpired}
        className="w-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold py-4 md:py-5 rounded-xl md:rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-2.5"
      >
        <span className="tracking-wider md:tracking-widest uppercase text-sm">
          {loading ? 'Mengirim...' : 'Kirim Jawaban'}
        </span>
        {!loading && (
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>
    </form>
  )
}
