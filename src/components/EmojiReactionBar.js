'use client'
import { useState } from 'react'

const EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🤔']

export default function EmojiReactionBar({ sessionId }) {
  const [cooldown, setCooldown] = useState(false)

  async function sendReaction(emoji) {
    if (cooldown) return
    setCooldown(true)

    await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, emoji }),
    })

    setTimeout(() => setCooldown(false), 800)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => sendReaction(emoji)}
          disabled={cooldown}
          className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/15 active:scale-90 disabled:opacity-40 transition-all text-lg border border-white/5"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
