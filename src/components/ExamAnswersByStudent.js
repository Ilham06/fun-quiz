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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-900">
          Jawaban Masuk
          <span className="font-medium text-gray-400 ml-1.5">({uniqueStudents} mahasiswa)</span>
        </h3>
        {hasScoring && students.length > 0 && (
          <button
            onClick={exportToExcel}
            className="bg-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 hover:bg-amber-500 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            Export Excel
          </button>
        )}
      </div>

      {students.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">Belum ada jawaban.</p>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
          {students.map((s) => {
            const isOpen = expanded === s.name
            const scorePercent = hasScoring && s.total > 0
              ? Math.round((s.correct / s.total) * 100)
              : null
            const progressPercent = questions.length > 0
              ? Math.round((s.answeredCount / questions.length) * 100)
              : 0

            return (
              <div key={s.name}>
                <button
                  onClick={() => setExpanded(isOpen ? null : s.name)}
                  className="w-full text-left p-3 rounded-xl border border-gray-50 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-yellow-600">
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold uppercase text-gray-800 truncate">{s.name}</span>
                        {hasScoring && (
                          <span className={`text-[10px] font-bold ${
                            scorePercent >= 70 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {s.correct}/{s.total}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            scorePercent >= 70
                              ? 'bg-amber-400'
                              : scorePercent >= 40
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 flex items-center pl-2 shrink-0">
                      {s.answeredCount}/{questions.length} soal
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d={isOpen ? 'M5 15l7-7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
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
                              ? 'bg-white border-gray-200'
                              : hasCorrect
                                ? isCorrect
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : 'bg-red-50 border-red-200'
                                : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-gray-300 mt-0.5 w-4 shrink-0 text-right">{qi + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 leading-snug truncate">{q.text}</p>
                              {ans ? (
                                <p className={`text-xs mt-0.5 font-medium ${
                                  hasCorrect
                                    ? isCorrect ? 'text-emerald-600' : 'text-red-500'
                                    : 'text-gray-600'
                                }`}>
                                  {ans.content}
                                  {hasCorrect && !isCorrect && (
                                    <span className="text-emerald-500 ml-2">({q.correct_answer})</span>
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400 mt-0.5">—</p>
                              )}
                            </div>
                            {ans && hasCorrect && (
                              <span className={`shrink-0 text-sm ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
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
