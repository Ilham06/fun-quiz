'use client'
import { useState } from 'react'
import { utils, writeFile } from 'xlsx'

export default function ExamAnswersByStudent({ answers, questions, sessionName }) {
  const [expanded, setExpanded] = useState(null)

  const byStudent = {}
  for (const a of answers) {
    const key = a.student_name || 'Anonim'
    if (!byStudent[key]) byStudent[key] = []
    byStudent[key].push(a)
  }

  const scorableQuestions = questions.filter(q => q.correct_answer)

  const students = Object.entries(byStudent).map(([name, studentAnswers]) => {
    const answerMap = {}
    for (const a of studentAnswers) {
      if (a.question_id) answerMap[a.question_id] = a
    }

    let correct = 0
    for (const q of scorableQuestions) {
      if (answerMap[q.id]?.content === q.correct_answer) correct++
    }

    return {
      name,
      answers: answerMap,
      answeredCount: Object.keys(answerMap).length,
      correct,
      total: scorableQuestions.length,
    }
  }).sort((a, b) => b.correct - a.correct || a.name.localeCompare(b.name))

  const uniqueStudents = students.length
  const hasScoring = scorableQuestions.length > 0

  function exportToExcel() {
    const rows = students.map((s) => {
      const wrong = s.total - s.correct
      const score = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
      return {
        'Nama': s.name,
        'Benar': s.correct,
        'Salah': wrong,
        'Total Soal': s.total,
        'Nilai': score,
      }
    })

    const ws = utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Hasil Ujian')
    const filename = `hasil_ujian${sessionName ? '_' + sessionName.replace(/[^a-zA-Z0-9]/g, '_') : ''}.xlsx`
    writeFile(wb, filename)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm">
          Jawaban Masuk
          <span className="text-white/30 font-normal ml-1.5">({uniqueStudents} mahasiswa)</span>
        </h3>
        {hasScoring && students.length > 0 && (
          <button
            onClick={exportToExcel}
            className="text-xs text-white/30 hover:text-amber-400 font-semibold transition-colors"
          >
            📥 Export Excel
          </button>
        )}
      </div>

      {students.length === 0 ? (
        <p className="text-white/25 text-sm py-8 text-center">Belum ada jawaban.</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
          {students.map((s) => {
            const isOpen = expanded === s.name
            const scorePercent = hasScoring && s.total > 0
              ? Math.round((s.correct / s.total) * 100)
              : null

            return (
              <div key={s.name}>
                <button
                  onClick={() => setExpanded(isOpen ? null : s.name)}
                  className="w-full text-left bg-white/[0.04] hover:bg-white/[0.06] rounded-xl px-4 py-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-amber-500/15 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-amber-400 text-xs font-black">
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white/90 text-sm font-medium truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 ml-3">
                      {hasScoring && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          scorePercent >= 70
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : scorePercent >= 40
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-red-500/15 text-red-400'
                        }`}>
                          {s.correct}/{s.total}
                        </span>
                      )}
                      <span className="text-white/20 text-xs">{s.answeredCount}/{questions.length} soal</span>
                      <span className="text-white/20 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-1 ml-2 space-y-1 mb-2">
                    {questions.map((q, qi) => {
                      const ans = s.answers[q.id]
                      const hasCorrect = !!q.correct_answer
                      const isCorrect = hasCorrect && ans?.content === q.correct_answer

                      return (
                        <div
                          key={q.id}
                          className={`rounded-lg px-3 py-2 border ${
                            !ans
                              ? 'bg-white/[0.02] border-white/[0.03]'
                              : hasCorrect
                                ? isCorrect
                                  ? 'bg-emerald-500/8 border-emerald-500/15'
                                  : 'bg-red-500/8 border-red-500/15'
                                : 'bg-white/[0.03] border-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-white/20 mt-0.5 w-4 shrink-0 text-right">{qi + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/40 leading-snug truncate">{q.text}</p>
                              {ans ? (
                                <p className={`text-xs mt-0.5 font-medium ${
                                  hasCorrect
                                    ? isCorrect ? 'text-emerald-400' : 'text-red-400'
                                    : 'text-white/70'
                                }`}>
                                  {ans.content}
                                  {hasCorrect && !isCorrect && (
                                    <span className="text-emerald-400/50 ml-2">({q.correct_answer})</span>
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-white/15 mt-0.5">—</p>
                              )}
                            </div>
                            {ans && hasCorrect && (
                              <span className={`shrink-0 text-sm ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isCorrect ? '✓' : '✗'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
