'use client'
import { useState, useEffect, useCallback } from 'react'

function ExamTimer({ timerSeconds, onExpired }) {
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
    <div className="flex items-center gap-3">
      <div className={`font-mono text-lg font-black ${timeLeft <= 10 ? 'text-red-400 animate-countdown-pulse' : 'text-white/70'}`}>
        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
      </div>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / timerSeconds) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function ExamFlow({ session, questions, theme }) {
  const [name, setName] = useState('')
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [content, setContent] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timerExpired, setTimerExpired] = useState(false)
  const [answeredIds, setAnsweredIds] = useState(new Set())

  const currentQuestion = questions[currentIndex] || null
  const isFinished = currentIndex >= questions.length
  const totalQuestions = questions.length

  useEffect(() => {
    const saved = sessionStorage.getItem(`exam-${session.id}-name`)
    if (saved) setName(saved)
    const savedProgress = sessionStorage.getItem(`exam-${session.id}-progress`)
    if (savedProgress) {
      try {
        const { index, answered } = JSON.parse(savedProgress)
        setCurrentIndex(index)
        setAnsweredIds(new Set(answered))
        setStarted(true)
      } catch {}
    }
  }, [session.id])

  const saveProgress = useCallback((index, answered) => {
    sessionStorage.setItem(`exam-${session.id}-progress`, JSON.stringify({
      index,
      answered: [...answered],
    }))
  }, [session.id])

  function handleStart(e) {
    e.preventDefault()
    if (!name.trim()) return
    sessionStorage.setItem(`exam-${session.id}-name`, name.trim())
    setStarted(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const answerContent =
      currentQuestion?.type === 'multiple_choice' && selectedOption !== null
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
        question_id: currentQuestion.id,
        student_name: name.trim(),
        content: answerContent,
      }),
    })

    if (res.ok) {
      const newAnswered = new Set(answeredIds)
      newAnswered.add(currentQuestion.id)
      setAnsweredIds(newAnswered)

      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setContent('')
      setSelectedOption(null)
      setTimerExpired(false)
      saveProgress(nextIndex, newAnswered)
    } else {
      const data = await res.json()
      setError(data.error || 'Gagal mengirim jawaban.')
    }
    setLoading(false)
  }

  function handleTimerExpired() {
    setTimerExpired(true)
    setTimeout(async () => {
      const answerContent =
        currentQuestion?.type === 'multiple_choice' && selectedOption !== null
          ? selectedOption
          : content

      if (answerContent?.trim()) {
        await fetch('/api/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.id,
            question_id: currentQuestion.id,
            student_name: name.trim(),
            content: answerContent,
          }),
        })
        const newAnswered = new Set(answeredIds)
        newAnswered.add(currentQuestion.id)
        setAnsweredIds(newAnswered)
      }

      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setContent('')
      setSelectedOption(null)
      setTimerExpired(false)
      saveProgress(nextIndex, answeredIds)
    }, 1500)
  }

  if (!session.is_active) {
    return (
      <div className="text-center py-20 animate-fade-up">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⏳</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Ujian belum dimulai</h2>
        <p className="text-white/40 text-sm">Tunggu pengajar mengaktifkan sesi ujian.</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-up">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Belum ada soal</h2>
        <p className="text-white/40 text-sm">Pengajar belum menambahkan soal ujian.</p>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="animate-fade-up">
        <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-6 text-center mb-4">
          <div className="text-4xl mb-3">📝</div>
          <h2 className="text-xl font-bold text-white mb-2">{session.title}</h2>
          {session.description && (
            <p className="text-white/50 text-sm mb-4">{session.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-white/40">
            <span>{totalQuestions} soal</span>
            {questions.some(q => q.timer_seconds > 0) && (
              <span>Ada batas waktu per soal</span>
            )}
          </div>
        </div>

        <form onSubmit={handleStart} className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-400 focus:outline-none text-white placeholder:text-white/20"
              placeholder="Masukkan nama lengkap kamu"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
          >
            Mulai Ujian
          </button>
        </form>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Ujian Selesai!</h2>
        <p className="text-white/50 text-sm mb-1">
          Kamu telah menjawab {answeredIds.size} dari {totalQuestions} soal.
        </p>
        <p className="text-white/30 text-sm">Terima kasih, {name}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Progress bar */}
      <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Progres</span>
          <span className="text-xs font-bold text-white/60">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
            Soal {currentIndex + 1}
          </span>
          {currentQuestion.type === 'multiple_choice' && (
            <span className="text-xs text-white/30">Pilihan ganda</span>
          )}
        </div>
        <p className="text-white font-semibold text-lg leading-snug">{currentQuestion.text}</p>
      </div>

      {/* Timer */}
      {currentQuestion.timer_seconds > 0 && (
        <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4">
          <ExamTimer
            key={currentQuestion.id}
            timerSeconds={currentQuestion.timer_seconds}
            onExpired={handleTimerExpired}
          />
          {timerExpired && (
            <p className="text-center text-red-400 text-sm font-medium mt-2 animate-fade-up">
              Waktu habis! Lanjut ke soal berikutnya...
            </p>
          )}
        </div>
      )}

      {/* Answer form */}
      <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-4">
        {currentQuestion.type === 'multiple_choice' && currentQuestion.options?.length > 0 ? (
          <div className="space-y-2">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedOption(opt)}
                disabled={timerExpired}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all disabled:opacity-40 ${
                  selectedOption === opt
                    ? 'border-blue-400 bg-blue-500/20 text-white'
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
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-400 focus:outline-none text-white resize-none placeholder:text-white/20 disabled:opacity-40"
            placeholder="Tulis jawabanmu..."
          />
        )}

        {error && <p className="text-red-400 text-sm animate-fade-up">{error}</p>}

        <button
          type="submit"
          disabled={loading || timerExpired}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-30 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
        >
          {loading ? 'Mengirim...' : currentIndex < totalQuestions - 1 ? 'Jawab & Lanjut' : 'Jawab & Selesai'}
        </button>
      </form>
    </div>
  )
}
