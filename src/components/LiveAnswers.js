'use client'
import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LiveAnswers({ sessionId, initialAnswers = [] }) {
  const [answers, setAnswers] = useState(initialAnswers)
  const [connected, setConnected] = useState(false)
  const [newIds, setNewIds] = useState(new Set())
  const bottomRef = useRef(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const channel = supabase
      .channel(`answers:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newAnswer = payload.new
          setAnswers((prev) => [newAnswer, ...prev])
          setNewIds((prev) => {
            const next = new Set(prev)
            next.add(newAnswer.id)
            setTimeout(() => {
              setNewIds((p) => {
                const n = new Set(p)
                n.delete(newAnswer.id)
                return n
              })
            }, 2000)
            return next
          })
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [answers.length])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`}
        />
        <span className="text-sm text-white/60">
          {connected ? 'Live' : 'Menghubungkan...'}
        </span>
        <span className="ml-auto text-sm text-white/60">
          {answers.length} jawaban
        </span>
      </div>

      {answers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-white/40 text-lg">
          Menunggu jawaban pertama...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {answers.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl px-5 py-4 transition-all duration-500 ${
                newIds.has(a.id)
                  ? 'bg-violet-500 scale-105 shadow-lg shadow-violet-900/30'
                  : 'bg-white/10'
              }`}
            >
              <p className="text-white text-lg font-medium leading-snug">
                {a.content}
              </p>
              <p className="text-white/50 text-sm mt-1.5">
                {a.student_name || 'Anonim'} &middot;{' '}
                {new Date(a.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
