'use client'
import { useState } from 'react'
import { getSocket } from '@/lib/socket'

const EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🤔']

export default function EmojiReactionBar({ sessionId }) {
  const [cooldown, setCooldown] = useState(false)

  async function sendReaction(emoji) {
    if (cooldown) return
    setCooldown(true)

    const res = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, emoji }),
    })

    if (res.ok) {
      const reaction = await res.json()
      getSocket().emit('new-reaction', reaction)
    }

    setTimeout(() => setCooldown(false), 800)
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl px-4 md:px-6 py-2.5 md:py-3 rounded-full shadow-xl border border-gray-100 inline-flex items-center gap-3 md:gap-5">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => sendReaction(emoji)}
          disabled={cooldown}
          className="hover:scale-125 active:scale-90 disabled:opacity-40 transition-transform duration-200 text-xl md:text-2xl"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
