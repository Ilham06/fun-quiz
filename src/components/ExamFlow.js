'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

function seededRandom(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return function () {
    h = h ^ (h << 13); h = h ^ (h >> 17); h = h ^ (h << 5)
    return (h >>> 0) / 4294967296
  }
}

function shuffleArray(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function TabWarningBanner({ count }) {
  if (count === 0) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-xl">⚠️</span>
        </div>
        <div>
          <p className="text-red-700 font-semibold text-sm">
            Terdeteksi meninggalkan halaman {count}x
          </p>
          <p className="text-red-600/80 text-xs mt-0.5">
            Aktivitas ini tercatat dan akan dilaporkan ke pengajar.
          </p>
        </div>
      </div>
    </div>
  )
}

function useTabDetection({ sessionId, studentName, questionId, enabled }) {
  const [violationCount, setViolationCount] = useState(0)
  const leftAtRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const savedCount = sessionStorage.getItem(`exam-${sessionId}-violations`)
    if (savedCount) setViolationCount(parseInt(savedCount) || 0)
  }, [enabled, sessionId])

  useEffect(() => {
    if (!enabled) return

    function reportViolation(leftAt, returnedAt) {
      const durationSeconds = (returnedAt - leftAt) / 1000
      if (durationSeconds < 0.5) return

      setViolationCount(prev => {
        const next = prev + 1
        sessionStorage.setItem(`exam-${sessionId}-violations`, String(next))
        return next
      })

      fetch('/api/tab-violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: questionId || null,
          student_name: studentName || null,
          left_at: new Date(leftAt).toISOString(),
          returned_at: new Date(returnedAt).toISOString(),
          duration_seconds: Math.round(durationSeconds * 10) / 10,
        }),
      }).catch(() => {})
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        leftAtRef.current = Date.now()
      } else if (leftAtRef.current) {
        reportViolation(leftAtRef.current, Date.now())
        leftAtRef.current = null
      }
    }

    function handleBlur() {
      if (!leftAtRef.current) leftAtRef.current = Date.now()
    }

    function handleFocus() {
      if (leftAtRef.current) {
        reportViolation(leftAtRef.current, Date.now())
        leftAtRef.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, sessionId, studentName, questionId])

  return violationCount
}

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
    <div className="flex items-center gap-2 text-red-500 font-semibold">
      <span className="text-lg">⏱</span>
      <span className={`font-mono text-sm font-bold ${timeLeft <= 10 ? 'animate-countdown-pulse' : ''}`}>
        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
      </span>
    </div>
  )
}

export default function ExamFlow({ session, questions, theme }) {
  const quizMode = session.quiz_mode || 'one_by_one'

  if (quizMode === 'all_at_once') {
    return <AllAtOnceExam session={session} questions={questions} theme={theme} />
  }
  return <OneByOneExam session={session} questions={questions} theme={theme} />
}

/* ════════════════════════════════════════════════════════════════════
   MODE 1: One-by-One (original behavior)
   ════════════════════════════════════════════════════════════════════ */

function OneByOneExam({ session, questions, theme }) {
  const [name, setName] = useState('')
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [content, setContent] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timerExpired, setTimerExpired] = useState(false)
  const [answeredIds, setAnsweredIds] = useState(new Set())
  const [studentAnswers, setStudentAnswers] = useState({})

  const shuffledQuestions = useMemo(() => {
    if (!started || !name) return questions
    const seed = `${session.id}-${name.trim().toLowerCase()}`
    let qs = [...questions]
    if (session.shuffle_questions) {
      qs = shuffleArray(qs, seededRandom(seed + '-q'))
    }
    if (session.shuffle_options) {
      qs = qs.map((q) => {
        if (q.type === 'multiple_choice' && q.options?.length > 1) {
          return { ...q, options: shuffleArray(q.options, seededRandom(seed + '-o-' + q.id)) }
        }
        return q
      })
    }
    return qs
  }, [started, name, questions, session.id, session.shuffle_questions, session.shuffle_options])

  const currentQuestion = shuffledQuestions[currentIndex] || null
  const isFinished = currentIndex >= shuffledQuestions.length
  const totalQuestions = shuffledQuestions.length

  const violationCount = useTabDetection({
    sessionId: session.id,
    studentName: name,
    questionId: currentQuestion?.id,
    enabled: started && !isFinished,
  })

  useEffect(() => {
    const saved = sessionStorage.getItem(`exam-${session.id}-name`)
    if (saved) setName(saved)
    const savedProgress = sessionStorage.getItem(`exam-${session.id}-progress`)
    if (savedProgress) {
      try {
        const { index, answered, answers: savedAnswers } = JSON.parse(savedProgress)
        setCurrentIndex(index)
        setAnsweredIds(new Set(answered))
        if (savedAnswers) setStudentAnswers(savedAnswers)
        setStarted(true)
      } catch {}
    }
  }, [session.id])

  const saveProgress = useCallback((index, answered, answers) => {
    sessionStorage.setItem(`exam-${session.id}-progress`, JSON.stringify({
      index,
      answered: [...answered],
      answers,
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

      const newStudentAnswers = { ...studentAnswers, [currentQuestion.id]: answerContent }
      setStudentAnswers(newStudentAnswers)

      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setContent('')
      setSelectedOption(null)
      setTimerExpired(false)
      saveProgress(nextIndex, newAnswered, newStudentAnswers)
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

      let newStudentAnswers = { ...studentAnswers }
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
        newStudentAnswers = { ...newStudentAnswers, [currentQuestion.id]: answerContent }
        setStudentAnswers(newStudentAnswers)
      }

      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setContent('')
      setSelectedOption(null)
      setTimerExpired(false)
      saveProgress(nextIndex, answeredIds, newStudentAnswers)
    }, 1500)
  }

  if (!session.is_active) {
    return <InactiveState />
  }

  if (questions.length === 0) {
    return <EmptyState />
  }

  if (!started) {
    return <StartScreen session={session} name={name} setName={setName} onStart={handleStart} totalQuestions={totalQuestions} questions={questions} />
  }

  if (isFinished) {
    return (
      <FinishedScreen
        session={session}
        shuffledQuestions={shuffledQuestions}
        studentAnswers={studentAnswers}
        answeredIds={answeredIds}
        totalQuestions={totalQuestions}
        violationCount={violationCount}
        name={name}
      />
    )
  }

  const progressPercent = (currentIndex / totalQuestions) * 100

  return (
    <div className="space-y-6 animate-fade-up">
      <TabWarningBanner count={violationCount} />

      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="uppercase tracking-[0.1em] text-[0.7rem] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            {session.title}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold mt-4 text-gray-900">
            Pertanyaan {currentIndex + 1} dari {totalQuestions}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {currentQuestion.timer_seconds > 0 && (
            <ExamTimer
              key={currentQuestion.id}
              timerSeconds={currentQuestion.timer_seconds}
              onExpired={handleTimerExpired}
            />
          )}
          <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
            <span>📊</span>
            <span className="font-semibold">{currentIndex + 1}/{totalQuestions}</span>
          </div>
        </div>
      </div>

      {timerExpired && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center animate-fade-up">
          <p className="text-red-600 text-sm font-medium">Waktu habis! Lanjut ke soal berikutnya...</p>
        </div>
      )}

      <div className="bg-white p-8 md:p-12 rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.04)] border border-gray-200">
        <p className="text-xl md:text-2xl font-medium leading-relaxed text-gray-900 mb-10">
          {currentQuestion.text}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">
              Jawaban Anda
            </label>

            {currentQuestion.type === 'multiple_choice' && currentQuestion.options?.length > 0 ? (
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedOption(opt)}
                    disabled={timerExpired}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all disabled:opacity-40 ${
                      selectedOption === opt
                        ? 'border-amber-500 bg-amber-50 text-gray-900 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 text-gray-800'
                    }`}
                  >
                    <span className="font-bold text-gray-400 mr-3 text-lg">{String.fromCharCode(65 + i)}.</span>
                    <span className="text-base">{opt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                required
                disabled={timerExpired}
                maxLength={500}
                className="w-full min-h-[200px] bg-gray-100 border-none rounded-xl p-6 text-lg text-gray-900 focus:ring-2 focus:ring-amber-500/50 focus:bg-white resize-none placeholder:text-gray-400/60 disabled:opacity-40 transition-all"
                placeholder="Tuliskan jawaban Anda di sini..."
              />
            )}
          </div>

          {error && <p className="text-red-500 text-sm animate-fade-up">{error}</p>}

          {currentQuestion.type !== 'multiple_choice' && (
            <div className="p-5 bg-gray-50/80 backdrop-blur-sm rounded-xl flex gap-4 items-start border border-gray-200/60">
              <span className="text-amber-500 text-xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-gray-700">Petunjuk</p>
                <p className="text-sm text-gray-500">Jawab dengan detail dan jelas untuk mendapatkan nilai terbaik.</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-gray-400 text-sm">
              {currentIndex > 0 && (
                <span>{currentIndex} soal terjawab</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || timerExpired}
              className="flex items-center gap-2 px-8 md:px-10 py-3.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:scale-100 text-base"
            >
              {loading
                ? 'Mengirim...'
                : currentIndex < totalQuestions - 1
                  ? 'Berikutnya'
                  : 'Selesai'
              }
              <span className="text-lg">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MODE 2: All-at-Once — paper exam feel
   ════════════════════════════════════════════════════════════════════ */

function AllAtOnceExam({ session, questions, theme }) {
  const [name, setName] = useState('')
  const [started, setStarted] = useState(false)
  const [studentAnswers, setStudentAnswers] = useState({})
  const [openAnswers, setOpenAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [error, setError] = useState('')
  const questionRefs = useRef({})

  const shuffledQuestions = useMemo(() => {
    if (!started || !name) return questions
    const seed = `${session.id}-${name.trim().toLowerCase()}`
    let qs = [...questions]
    if (session.shuffle_questions) {
      qs = shuffleArray(qs, seededRandom(seed + '-q'))
    }
    if (session.shuffle_options) {
      qs = qs.map((q) => {
        if (q.type === 'multiple_choice' && q.options?.length > 1) {
          return { ...q, options: shuffleArray(q.options, seededRandom(seed + '-o-' + q.id)) }
        }
        return q
      })
    }
    return qs
  }, [started, name, questions, session.id, session.shuffle_questions, session.shuffle_options])

  const totalQuestions = shuffledQuestions.length
  const answeredCount = Object.keys(studentAnswers).length

  const violationCount = useTabDetection({
    sessionId: session.id,
    studentName: name,
    questionId: null,
    enabled: started && !isFinished,
  })

  useEffect(() => {
    const saved = sessionStorage.getItem(`exam-${session.id}-name`)
    if (saved) setName(saved)
    const savedProgress = sessionStorage.getItem(`exam-${session.id}-paper-progress`)
    if (savedProgress) {
      try {
        const { answers: savedAnswers, openAns, finished } = JSON.parse(savedProgress)
        if (savedAnswers) setStudentAnswers(savedAnswers)
        if (openAns) setOpenAnswers(openAns)
        if (finished) setIsFinished(true)
        setStarted(true)
      } catch {}
    }
  }, [session.id])

  const saveProgress = useCallback((answers, openAns, finished = false) => {
    sessionStorage.setItem(`exam-${session.id}-paper-progress`, JSON.stringify({
      answers,
      openAns,
      finished,
    }))
  }, [session.id])

  function handleStart(e) {
    e.preventDefault()
    if (!name.trim()) return
    sessionStorage.setItem(`exam-${session.id}-name`, name.trim())
    setStarted(true)
  }

  function selectOption(questionId, option) {
    const next = { ...studentAnswers, [questionId]: option }
    setStudentAnswers(next)
    saveProgress(next, openAnswers)
  }

  function updateOpenAnswer(questionId, value) {
    const nextOpen = { ...openAnswers, [questionId]: value }
    setOpenAnswers(nextOpen)
    if (value.trim()) {
      const next = { ...studentAnswers, [questionId]: value }
      setStudentAnswers(next)
      saveProgress(next, nextOpen)
    } else {
      const next = { ...studentAnswers }
      delete next[questionId]
      setStudentAnswers(next)
      saveProgress(next, nextOpen)
    }
  }

  function scrollToQuestion(idx) {
    const qId = shuffledQuestions[idx]?.id
    if (qId && questionRefs.current[qId]) {
      questionRefs.current[qId].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  async function handleSubmitAll() {
    setError('')
    setLoading(true)

    const promises = shuffledQuestions
      .filter(q => studentAnswers[q.id]?.trim())
      .map(q =>
        fetch('/api/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.id,
            question_id: q.id,
            student_name: name.trim(),
            content: studentAnswers[q.id],
          }),
        })
      )

    try {
      const results = await Promise.all(promises)
      const allOk = results.every(r => r.ok)
      if (allOk) {
        setIsFinished(true)
        saveProgress(studentAnswers, openAnswers, true)
      } else {
        setError('Beberapa jawaban gagal terkirim. Coba lagi.')
      }
    } catch {
      setError('Gagal mengirim jawaban. Periksa koneksi internet.')
    }
    setLoading(false)
  }

  if (!session.is_active) {
    return <InactiveState />
  }

  if (questions.length === 0) {
    return <EmptyState />
  }

  if (!started) {
    return <StartScreen session={session} name={name} setName={setName} onStart={handleStart} totalQuestions={totalQuestions} questions={questions} allAtOnce />
  }

  if (isFinished) {
    return (
      <FinishedScreen
        session={session}
        shuffledQuestions={shuffledQuestions}
        studentAnswers={studentAnswers}
        answeredIds={new Set(Object.keys(studentAnswers))}
        totalQuestions={totalQuestions}
        violationCount={violationCount}
        name={name}
      />
    )
  }

  return (
    <div className="animate-fade-up">
      <TabWarningBanner count={violationCount} />

      {/* Sticky header with progress + question navigator */}
      <div className="sticky top-14 md:top-16 z-40 bg-[#f8f9fa]/95 backdrop-blur-md pb-3 pt-3 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-gray-200/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="uppercase tracking-[0.1em] text-[0.7rem] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              {session.title}
            </span>
            <p className="text-sm text-gray-500 mt-1.5">
              <span className="font-bold text-gray-800">{answeredCount}</span> dari {totalQuestions} soal dijawab
            </p>
          </div>
          <button
            onClick={handleSubmitAll}
            disabled={loading || answeredCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:scale-100 text-sm"
          >
            {loading ? 'Mengirim...' : 'Kumpulkan'}
            <span>→</span>
          </button>
        </div>

        {/* Question number pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {shuffledQuestions.map((q, i) => {
            const answered = !!studentAnswers[q.id]?.trim()
            return (
              <button
                key={q.id}
                onClick={() => scrollToQuestion(i)}
                className={`shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  answered
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-gray-400 border border-gray-200 hover:border-amber-300'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center mt-4 animate-fade-up">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* All questions */}
      <div className="space-y-5 mt-5">
        {shuffledQuestions.map((q, i) => {
          const answered = !!studentAnswers[q.id]?.trim()
          return (
            <div
              key={q.id}
              ref={el => { questionRefs.current[q.id] = el }}
              className={`bg-white rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.04)] border-2 transition-all ${
                answered ? 'border-amber-200' : 'border-gray-100'
              }`}
            >
              <div className="p-6 md:p-8">
                {/* Question header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                    answered
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <p className="text-lg md:text-xl font-medium leading-relaxed text-gray-900 pt-1">
                    {q.text}
                  </p>
                </div>

                {/* Answer area */}
                {q.type === 'multiple_choice' && q.options?.length > 0 ? (
                  <div className="space-y-2 ml-[52px]">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => selectOption(q.id, opt)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          studentAnswers[q.id] === opt
                            ? 'border-amber-500 bg-amber-50 text-gray-900 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 text-gray-800'
                        }`}
                      >
                        <span className="font-bold text-gray-400 mr-3">{String.fromCharCode(65 + oi)}.</span>
                        <span className="text-sm md:text-base">{opt}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ml-[52px]">
                    <textarea
                      value={openAnswers[q.id] || ''}
                      onChange={(e) => updateOpenAnswer(q.id, e.target.value)}
                      rows={3}
                      maxLength={500}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm md:text-base text-gray-900 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 focus:bg-white resize-none placeholder:text-gray-400/60 transition-all"
                      placeholder="Tuliskan jawaban Anda..."
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom submit bar */}
      <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 -mx-4 md:-mx-6 px-4 md:px-6 py-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-bold text-gray-800">{answeredCount}</span>/{totalQuestions} soal dijawab
            {answeredCount < totalQuestions && (
              <span className="text-amber-600 ml-2 text-xs font-medium">
                ({totalQuestions - answeredCount} belum dijawab)
              </span>
            )}
          </div>
          <button
            onClick={handleSubmitAll}
            disabled={loading || answeredCount === 0}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:scale-100 text-base"
          >
            {loading ? 'Mengirim semua jawaban...' : `Kumpulkan Jawaban (${answeredCount}/${totalQuestions})`}
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════════ */

function InactiveState() {
  return (
    <div className="text-center py-20 animate-fade-up">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
        <span className="text-3xl">⏳</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Ujian belum dimulai</h2>
      <p className="text-gray-500 text-sm">Tunggu pengajar mengaktifkan sesi ujian.</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20 animate-fade-up">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
        <span className="text-3xl">📋</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Belum ada soal</h2>
      <p className="text-gray-500 text-sm">Pengajar belum menambahkan soal ujian.</p>
    </div>
  )
}

function StartScreen({ session, name, setName, onStart, totalQuestions, questions, allAtOnce }) {
  return (
    <div className="animate-fade-up max-w-lg mx-auto space-y-6 py-6">
      <div className="bg-white border border-gray-200 shadow-[0px_12px_32px_rgba(25,28,29,0.04)] rounded-xl p-8 md:p-12 text-center">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{session.title}</h2>
        {session.description && (
          <p className="text-gray-500 text-base mb-6">{session.description}</p>
        )}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">📋 {totalQuestions} soal</span>
          {allAtOnce ? (
            <span className="flex items-center gap-1.5">📄 Semua soal sekaligus</span>
          ) : (
            questions.some(q => q.timer_seconds > 0) && (
              <span className="flex items-center gap-1.5">⏱ Ada batas waktu</span>
            )
          )}
        </div>
      </div>

      <form onSubmit={onStart} className="bg-white border border-gray-200 shadow-[0px_12px_32px_rgba(25,28,29,0.04)] rounded-xl p-8 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
            Identitas
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            className="w-full px-4 py-3.5 rounded-xl bg-gray-100 border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white focus:outline-none text-gray-900 text-lg placeholder:text-gray-400 transition-all"
            placeholder="Masukkan Nama Lengkap/NIM/Kelas"
          />
        </div>
        <div className="text-xs text-gray-500 mb-2">
          <p>
            <span className="font-bold text-gray-800">Catatan:</span>
            <br />
            <span className="text-gray-500">Masukkan Nama Lengkap/NIM/Kelas.</span>
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-md text-lg"
        >
          Mulai Ujian →
        </button>
      </form>
    </div>
  )
}

function FinishedScreen({ session, shuffledQuestions, studentAnswers, answeredIds, totalQuestions, violationCount, name }) {
  const scorableQuestions = shuffledQuestions.filter(q => q.correct_answer)
  const correctCount = scorableQuestions.filter(q => studentAnswers[q.id] === q.correct_answer).length
  const hasScore = scorableQuestions.length > 0
  const scorePercent = hasScore ? Math.round((correctCount / scorableQuestions.length) * 100) : 0
  const gaugeArc = 157
  const gaugeFilled = hasScore ? (gaugeArc * scorePercent) / 100 : 0

  const feedbackText = scorePercent >= 80
    ? 'Luar Biasa! Kerja Bagus! 🎉'
    : scorePercent >= 60
      ? 'Bagus! Hampir Sempurna!'
      : scorePercent >= 40
        ? 'Cukup Baik, Terus Belajar!'
        : 'Tetap Semangat & Terus Belajar'

  return (
    <div className="animate-fade-up relative">
      <div className="absolute top-32 left-[15%] w-[60px] h-[60px] rounded-full border-2 border-amber-400 opacity-10 pointer-events-none" />
      <div className="absolute top-60 right-[10%] w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-amber-400 opacity-10 rotate-45 pointer-events-none" />
      <div className="absolute bottom-40 left-[10%] w-[30px] h-[30px] border-2 border-amber-400 opacity-10 rotate-[15deg] pointer-events-none" />
      <div className="absolute bottom-20 right-[15%] w-[40px] h-[40px] rounded-full border-2 border-amber-400 opacity-10 pointer-events-none" />

      <div className="flex flex-col items-center relative z-10 py-6">
        <section className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10L62 35H38L50 10Z" fill="#FBBF24" />
              <circle cx="50" cy="50" r="30" fill="#FBBF24" />
              <rect x="42" y="75" width="16" height="10" rx="2" fill="#F59E0B" />
              <rect x="35" y="85" width="30" height="5" rx="2" fill="#D97706" />
              <path d="M50 25L53 34H47L50 25Z" fill="white" opacity="0.5" />
              <line x1="50" y1="5" x2="50" y2="15" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
              <line x1="15" y1="40" x2="25" y2="45" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
              <line x1="85" y1="40" x2="75" y2="45" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Ujian Selesai!</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Kamu telah menjawab {answeredIds.size} dari {totalQuestions} soal.<br />
            Terima kasih, {name}.
          </p>
        </section>

        <article className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-8 md:p-10 border border-gray-50">
          {hasScore && (
            <div className="flex flex-col items-center mb-12">
              <div className="relative w-[200px] h-[100px] overflow-hidden mb-2">
                <svg width="200" height="100" viewBox="0 0 120 60">
                  <path d="M10 50 A 50 50 0 0 1 110 50" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  <path
                    d="M10 50 A 50 50 0 0 1 110 50"
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${gaugeFilled} ${gaugeArc}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                  <span className="text-4xl font-extrabold text-slate-800">
                    {correctCount}<span className="text-2xl text-gray-300 mx-1">/</span>{scorableQuestions.length}
                  </span>
                  <span className="text-sm font-bold text-amber-500 mt-1">{scorePercent}%</span>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-800 mt-4">{feedbackText}</p>
            </div>
          )}

          <div className="space-y-4 mb-10">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Detail Jawaban</h2>
            {shuffledQuestions.map((q, i) => {
              const myAnswer = studentAnswers[q.id]
              const hasCorrect = !!q.correct_answer
              const isCorrect = hasCorrect && myAnswer === q.correct_answer
              const isWrong = hasCorrect && myAnswer && !isCorrect

              return (
                <div
                  key={q.id}
                  className={`rounded-xl p-4 flex gap-4 items-start ${
                    !hasCorrect
                      ? 'bg-gray-50 border border-gray-100'
                      : isCorrect
                        ? 'bg-green-50/50 border border-green-100 shadow-sm'
                        : 'bg-red-50/50 border border-red-100 shadow-sm'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${
                    !hasCorrect
                      ? 'bg-gray-200 text-gray-500'
                      : isCorrect
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-red-500/10 text-red-500'
                  }`}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 mb-1">{q.text}</p>
                    {myAnswer ? (
                      <>
                        <p className={`text-[11px] font-medium ${
                          !hasCorrect
                            ? 'text-gray-500'
                            : isCorrect
                              ? 'text-green-600'
                              : 'text-red-500'
                        }`}>
                          Jawaban: {myAnswer} {isWrong && '✗'}
                        </p>
                        {hasCorrect && !isCorrect && (
                          <p className="text-[11px] text-green-600 font-medium">Jawaban benar: {q.correct_answer}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-gray-400">Tidak dijawab</p>
                    )}
                  </div>

                  {hasCorrect && myAnswer && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                    }`}>
                      {isCorrect ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {violationCount > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-center">
              <p className="text-red-700 text-sm">
                Kamu tercatat meninggalkan halaman <span className="font-bold text-red-800">{violationCount}x</span> selama ujian.
              </p>
            </div>
          )}

          <a
            href={`/quiz/${session.code}`}
            className="block w-full bg-amber-400 hover:bg-amber-500 text-slate-800 font-bold py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-amber-200 text-center text-base"
          >
            Selesai
          </a>
        </article>
      </div>
    </div>
  )
}
