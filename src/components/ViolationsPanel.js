'use client'
import { useState } from 'react'

export default function ViolationsPanel({ violations, questions }) {
  const [expanded, setExpanded] = useState(null)

  const byStudent = {}
  for (const v of violations) {
    const key = v.student_name || 'Anonim'
    if (!byStudent[key]) {
      byStudent[key] = { count: 0, totalDuration: 0, violations: [] }
    }
    byStudent[key].count++
    byStudent[key].totalDuration += v.duration_seconds || 0
    byStudent[key].violations.push(v)
  }

  const students = Object.entries(byStudent)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)

  const questionMap = {}
  for (const q of questions) {
    questionMap[q.id] = q
  }

  function getQuestionLabel(qId) {
    if (!qId) return '—'
    const q = questionMap[qId]
    if (!q) return '—'
    const idx = questions.findIndex(x => x.id === qId)
    return `Soal ${idx + 1}`
  }

  function formatDuration(secs) {
    if (!secs || secs < 1) return '<1 detik'
    if (secs < 60) return `${Math.round(secs)} detik`
    return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`
  }

  return (
    <div className="bg-red-500/[0.04] border border-red-500/10 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-lg">⚠️</span>
        <h3 className="font-semibold text-red-300 text-sm">
          Deteksi Pindah Tab
          <span className="text-red-300/40 font-normal ml-1.5">
            ({violations.length} pelanggaran, {students.length} mahasiswa)
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {students.map((s) => (
          <div key={s.name}>
            <button
              onClick={() => setExpanded(expanded === s.name ? null : s.name)}
              className="w-full text-left bg-white/[0.04] hover:bg-white/[0.06] rounded-xl px-4 py-3 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-white/90 text-sm font-medium">{s.name}</span>
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">
                    {s.count}x pindah tab
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/30 text-xs">
                    Total: {formatDuration(s.totalDuration)}
                  </span>
                  <span className="text-white/20 text-xs">{expanded === s.name ? '▲' : '▼'}</span>
                </div>
              </div>
            </button>

            {expanded === s.name && (
              <div className="ml-4 mt-1 space-y-1 mb-2">
                {s.violations.map((v) => (
                  <div key={v.id} className="bg-white/[0.02] rounded-lg px-3 py-2 flex items-center gap-3 text-xs">
                    <span className="text-white/30">{getQuestionLabel(v.question_id)}</span>
                    <span className="text-white/50">
                      {new Date(v.left_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      {v.returned_at && (
                        <> → {new Date(v.returned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
                      )}
                    </span>
                    <span className="text-red-400/70 ml-auto">{formatDuration(v.duration_seconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
