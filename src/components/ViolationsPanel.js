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

  const TYPE_LABELS = {
    tab_hidden: { label: 'Pindah Tab', color: 'bg-red-100 text-red-600' },
    window_blur: { label: 'Pindah App', color: 'bg-orange-100 text-orange-600' },
    devtools_open: { label: 'Buka DevTools', color: 'bg-purple-100 text-purple-600' },
    page_leave: { label: 'Refresh/Tutup', color: 'bg-blue-100 text-blue-600' },
    external_paste: { label: 'Copy-Paste', color: 'bg-yellow-100 text-yellow-700' },
  }

  return (
    <section className="bg-red-50 border border-red-100 rounded-2xl p-5">
      <div className="flex items-center text-red-800 font-bold text-sm mb-4">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path clipRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
        </svg>
        Deteksi Pindah Tab
        <span className="ml-2 font-medium opacity-75">
          ({violations.length} pelanggaran, {students.length} mahasiswa)
        </span>
      </div>

      <div className="space-y-2">
        {students.map((s) => (
          <div key={s.name}>
            <button
              onClick={() => setExpanded(expanded === s.name ? null : s.name)}
              className="w-full text-left bg-white/60 rounded-xl px-4 py-3 border border-white hover:bg-white/80 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold uppercase text-gray-800">{s.name}</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold">
                    {s.count}x pindah tab
                  </span>
                </div>
                <div className="flex items-center text-gray-500 text-xs">
                  <span>Total: {formatDuration(s.totalDuration)}</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d={expanded === s.name ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </button>

            {expanded === s.name && (
              <div className="ml-4 mt-1 space-y-1 mb-2">
                {s.violations.map((v) => {
                  const typeMeta = TYPE_LABELS[v.type] || TYPE_LABELS.tab_hidden
                  return (
                    <div key={v.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-3 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${typeMeta.color}`}>
                        {typeMeta.label}
                      </span>
                      <span className="text-gray-400">{getQuestionLabel(v.question_id)}</span>
                      <span className="text-gray-500">
                        {new Date(v.left_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        {v.returned_at && (
                          <> → {new Date(v.returned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
                        )}
                      </span>
                      <span className="text-red-500 ml-auto font-medium">{formatDuration(v.duration_seconds)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
