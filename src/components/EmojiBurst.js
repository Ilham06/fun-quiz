'use client'
import { useEffect, useState, useCallback } from 'react'
import { getSocket } from '@/lib/socket'

export default function EmojiBurst({ sessionId }) {
  const [bursts, setBursts] = useState([])

  const addBurst = useCallback((emoji) => {
    const id = Date.now() + Math.random()
    const left = 10 + Math.random() * 80
    setBursts((prev) => [...prev.slice(-30), { id, emoji, left }])
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id))
    }, 1400)
  }, [])

  useEffect(() => {
    const socket = getSocket()
    socket.emit('join-session', sessionId)

    function onReaction(data) {
      addBurst(data.emoji)
    }

    socket.on('reaction', onReaction)

    return () => {
      socket.off('reaction', onReaction)
    }
  }, [sessionId, addBurst])

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
