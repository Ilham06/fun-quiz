'use client'
import { useState } from 'react'

export default function RandomPicker({ answers }) {
  const [picked, setPicked] = useState(null)
  const [spinning, setSpinning] = useState(false)

  function pickRandom() {
    if (answers.length === 0 || spinning) return
    setSpinning(true)
    setPicked(null)

    let count = 0
    const total = 12 + Math.floor(Math.random() * 8)
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * answers.length)
      setPicked(answers[idx])
      count++
      if (count >= total) {
        clearInterval(interval)
        setSpinning(false)
      }
    }, 80 + count * 15)
  }

  return (
    <div className="text-center">
      <button
        onClick={pickRandom}
        disabled={spinning || answers.length === 0}
        className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm border border-amber-500/20 transition-all disabled:opacity-40 active:scale-95"
      >
        {spinning ? '🎰 ...' : '🎲 Random Pick'}
      </button>
      {picked && (
        <div className={`mt-4 bg-white/10 rounded-2xl p-5 border border-white/10 ${spinning ? 'opacity-50' : 'animate-pop-in'}`}>
          <p className="text-white text-xl font-bold leading-snug">{picked.content}</p>
          <p className="text-white/40 text-sm mt-2">— {picked.student_name || 'Anonim'}</p>
        </div>
      )}
    </div>
  )
}
