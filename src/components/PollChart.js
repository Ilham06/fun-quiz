'use client'
import { useMemo } from 'react'

const BAR_COLORS = [
  'from-purple-500 to-indigo-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-red-500 to-pink-500',
]

export default function PollChart({ options, answers }) {
  const results = useMemo(() => {
    if (!options?.length) return []
    const counts = {}
    options.forEach((o) => { counts[o] = 0 })
    answers.forEach((a) => {
      if (counts[a.content] !== undefined) counts[a.content]++
    })
    const total = answers.length || 1
    return options.map((opt, i) => ({
      label: opt,
      count: counts[opt],
      pct: Math.round((counts[opt] / total) * 100),
      color: BAR_COLORS[i % BAR_COLORS.length],
      letter: String.fromCharCode(65 + i),
    }))
  }, [options, answers])

  const maxCount = Math.max(...results.map((r) => r.count), 1)

  return (
    <div className="space-y-3">
      {results.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="text-white/40 font-bold text-sm w-6 text-right shrink-0">{r.letter}</span>
          <div className="flex-1 relative">
            <div className="h-10 bg-white/5 rounded-xl overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${r.color} rounded-xl animate-bar-grow`}
                style={{ width: `${Math.max((r.count / maxCount) * 100, 2)}%` }}
              />
            </div>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-sm font-medium mix-blend-difference">
              {r.label}
            </span>
          </div>
          <div className="text-right w-16 shrink-0">
            <span className="text-white font-bold text-lg">{r.count}</span>
            <span className="text-white/30 text-xs ml-1">({r.pct}%)</span>
          </div>
        </div>
      ))}
    </div>
  )
}
