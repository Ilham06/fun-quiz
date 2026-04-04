'use client'
import { useEffect, useState } from 'react'

export default function DisplayTimer({ seconds, questionId }) {
  const [startTime] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const secs = Math.floor((now - start) / 1000)
      setElapsed(secs)
      if (secs >= seconds) clearInterval(interval)
    }, 250)
    return () => clearInterval(interval)
  }, [seconds, questionId])

  const timeLeft = Math.max(0, seconds - elapsed)
  const pct = (timeLeft / seconds) * 100
  const isLow = timeLeft <= 10 && timeLeft > 0
  const isDone = timeLeft === 0

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className={`relative w-20 h-20 ${isLow ? 'animate-countdown-pulse' : ''}`}>
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke={isDone ? '#ef4444' : isLow ? '#f59e0b' : '#8b5cf6'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono font-black text-xl ${isDone ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'}`}>
            {timeLeft}
          </span>
        </div>
      </div>
      <span className="text-white/20 text-[10px] mt-1 font-bold uppercase tracking-wider">
        {isDone ? 'Selesai' : 'Detik'}
      </span>
    </div>
  )
}
