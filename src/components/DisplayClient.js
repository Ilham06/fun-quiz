'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import QRCode from '@/components/QRCode'
import EmojiBurst from '@/components/EmojiBurst'
import LiveAnswers from '@/components/LiveAnswers'
import WordCloud from '@/components/WordCloud'
import PollChart from '@/components/PollChart'
import RandomPicker from '@/components/RandomPicker'

export default function DisplayClient({ session, activeQuestion, initialAnswers, theme }) {
  const [tab, setTab] = useState('live')
  const [liveAnswers, setLiveAnswers] = useState(initialAnswers)
  const isMultipleChoice = activeQuestion?.type === 'multiple_choice' && activeQuestion?.options?.length > 0
  const supabase = createBrowserClient()
  const questionId = activeQuestion?.id || null

  useEffect(() => {
    const channel = supabase
      .channel(`display-answers:${session.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'answers',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        const incoming = payload.new
        const matchesQuestion = questionId
          ? incoming.question_id === questionId
          : incoming.question_id === null
        if (matchesQuestion) {
          setLiveAnswers((prev) => [incoming, ...prev])
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'answers',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        setLiveAnswers((prev) =>
          prev.map((a) => a.id === payload.new.id ? { ...a, upvotes: payload.new.upvotes } : a)
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id, questionId, supabase])

  const tabs = [
    { id: 'live', label: 'Live' },
    ...(isMultipleChoice ? [{ id: 'poll', label: 'Poll' }] : []),
    { id: 'cloud', label: 'Bubbles' },
    { id: 'random', label: 'Random' },
  ]

  return (
    <div className={`h-screen bg-gradient-to-br ${theme.bg} flex flex-col relative overflow-hidden`}>
      <EmojiBurst sessionId={session.id} />

      <header className="px-8 pt-6 pb-3 flex items-start justify-between relative z-10 shrink-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-white truncate">{session.title}</h1>
          {session.description && (
            <p className="text-white/30 text-sm mt-0.5 truncate">{session.description}</p>
          )}
        </div>
        <div className="flex items-start gap-4 shrink-0 ml-6">
          <div className="text-right">
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold mb-1">Kode</p>
            <p className="font-mono font-black text-3xl text-white tracking-widest">{session.code}</p>
            {session.is_active && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> LIVE
              </span>
            )}
          </div>
          <QRCode code={session.code} />
        </div>
      </header>

      {activeQuestion && (
        <div className="mx-8 mb-3 relative z-10 shrink-0">
          <div className="bg-white/[0.06] rounded-2xl px-6 py-4 border border-white/[0.06]">
            <div className="min-w-0">
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1.5">Pertanyaan</p>
              <p className="text-white text-xl sm:text-2xl font-bold leading-snug">{activeQuestion.text}</p>
              {isMultipleChoice && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeQuestion.options.map((opt, i) => (
                    <span key={i} className="bg-white/[0.06] text-white/70 px-3 py-1 rounded-full text-sm">
                      <span className="font-bold text-white/40">{String.fromCharCode(65 + i)}.</span> {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-8 mb-3 flex items-center gap-1 relative z-10 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t.id
                ? 'bg-white/10 text-white'
                : 'text-white/25 hover:text-white/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 mx-8 mb-0 overflow-hidden relative z-10 min-h-0">
        {tab === 'live' && (
          <LiveAnswers sessionId={session.id} questionId={questionId} initialAnswers={initialAnswers} showLikes={true} />
        )}
        {tab === 'poll' && isMultipleChoice && (
          <PollChart options={activeQuestion.options} answers={liveAnswers} />
        )}
        {tab === 'cloud' && (
          <WordCloud answers={liveAnswers} />
        )}
        {tab === 'random' && (
          <RandomPicker answers={liveAnswers} />
        )}
      </div>

      <footer className="px-8 py-2 flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center text-white font-black text-[8px]">Q</div>
          <span className="text-white/15 text-xs font-bold">funquiz</span>
        </div>
        <p className="text-white/15 text-xs">
          Scan QR atau buka kode <span className="font-mono font-bold text-white/30">{session.code}</span>
        </p>
      </footer>
    </div>
  )
}
