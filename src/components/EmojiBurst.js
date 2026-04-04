'use client'
import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export default function EmojiBurst({ sessionId }) {
  const [bursts, setBursts] = useState([])
  const supabase = createBrowserClient()

  const addBurst = useCallback((emoji) => {
    const id = Date.now() + Math.random()
    const left = 10 + Math.random() * 80
    setBursts((prev) => [...prev.slice(-30), { id, emoji, left }])
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id))
    }, 1400)
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel(`reactions:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reactions',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        addBurst(payload.new.emoji)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, supabase, addBurst])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {bursts.map((b) => (
        <div
          key={b.id}
          className="absolute bottom-0 animate-float-up text-4xl"
          style={{ left: `${b.left}%` }}
        >
          {b.emoji}
        </div>
      ))}
    </div>
  )
}
