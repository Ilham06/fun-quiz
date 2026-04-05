'use client'
import { useState, useEffect } from 'react'

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
      <div className="flex items-center justify-center gap-2">
        <div className={`font-mono text-2xl font-black ${timeLeft <= 10 ? 'text-red-400 animate-countdown-pulse' : 'text-white'}`}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / timerSeconds) * 100}%` }}
          />
        </div>
      </div>
      {expired && (
        <p className="text-center text-red-400 text-sm font-medium animate-fade-up">Waktu habis!</p>
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
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Gagal mengirim.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-8 animate-pop-in">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="text-lg font-bold text-white mb-1">Terkirim!</h2>
        <p className="text-white/40 text-sm">Terima kasih, {isAnon ? 'Anonim' : name || 'teman'}.</p>
        {/* <button
          onClick={() => { setSubmitted(false); setContent(''); setSelectedOption(null); setTimerExpired(false) }}
          className="mt-5 text-xs text-amber-400 hover:text-amber-300 font-medium"
        >
          Kirim lagi
        </button> */}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {timerSeconds > 0 && (
        <AnswerTimer
          key={activeQuestion?.id}
          timerSeconds={timerSeconds}
          questionId={activeQuestion?.id}
          onExpired={() => setTimerExpired(true)}
        />
      )}

      {/* Name */}
      <div className="flex items-center gap-2">
        {!isAnon && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-sm placeholder:text-white/20"
            placeholder="Nama kamu"
          />
        )}
        <button
          type="button"
          onClick={() => setIsAnon((v) => !v)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            isAnon
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/10'
          }`}
        >
          {isAnon ? '👤 Anonim' : 'Anonim?'}
        </button>
      </div>

      {/* Answer */}
      {activeQuestion?.type === 'multiple_choice' && activeQuestion.options?.length > 0 ? (
        <div className="space-y-2">
          {activeQuestion.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedOption(opt)}
              disabled={timerExpired}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all disabled:opacity-40 ${
                selectedOption === opt
                  ? 'border-amber-400 bg-amber-500/20 text-white'
                  : 'border-white/10 hover:border-white/20 text-white/80'
              }`}
            >
              <span className="font-bold text-white/40 mr-2">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          required
          disabled={timerExpired}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white resize-none placeholder:text-white/20 disabled:opacity-40"
          placeholder={activeQuestion ? 'Tulis jawabanmu...' : 'Tulis pesan atau jawabanmu...'}
        />
      )}

      {error && <p className="text-red-400 text-sm animate-fade-up">{error}</p>}

      <button
        type="submit"
        disabled={loading || timerExpired}
        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-30 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
      >
        {loading ? 'Mengirim...' : 'Kirim'}
      </button>
    </form>
  )
}
