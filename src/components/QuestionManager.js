'use client'
import { useState } from 'react'

export default function QuestionManager({ sessionId, initialQuestions = [], sessionType = 'quiz' }) {
  const isExam = sessionType === 'exam'
  const [questions, setQuestions] = useState(initialQuestions)
  const [showForm, setShowForm] = useState(false)
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState('open')
  const [newOptions, setNewOptions] = useState(['', ''])
  const [newTimer, setNewTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeId, setActiveId] = useState(
    initialQuestions.find((q) => q.is_active)?.id || null
  )

  async function addQuestion(e) {
    e.preventDefault()
    if (!newText.trim()) return
    setLoading(true)

    const options = newType === 'multiple_choice' ? newOptions.filter((o) => o.trim()) : null

    const res = await fetch(`/api/sessions/${sessionId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: newText,
        type: newType,
        options,
        timer_seconds: newTimer || 0,
        order: questions.length,
      }),
    })

    if (res.ok) {
      const q = await res.json()
      setQuestions((prev) => [...prev, q])
      setNewText('')
      setNewType('open')
      setNewOptions(['', ''])
      setNewTimer(0)
      setShowForm(false)
    }
    setLoading(false)
  }

  async function deleteQuestion(id) {
    if (!confirm('Hapus pertanyaan ini?')) return
    const res = await fetch(`/api/sessions/${sessionId}/questions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      if (activeId === id) setActiveId(null)
    }
  }

  async function activateQuestion(id) {
    const nextActive = activeId === id ? null : id
    await Promise.all(
      questions.map((q) =>
        fetch(`/api/sessions/${sessionId}/questions/${q.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: q.id === nextActive }),
        })
      )
    )
    setActiveId(nextActive)
    setQuestions((prev) => prev.map((q) => ({ ...q, is_active: q.id === nextActive })))
  }

  function navigateQuestion(direction) {
    const currentIdx = questions.findIndex((q) => q.id === activeId)
    let nextIdx
    if (direction === 'next') {
      nextIdx = currentIdx < questions.length - 1 ? currentIdx + 1 : 0
    } else {
      nextIdx = currentIdx > 0 ? currentIdx - 1 : questions.length - 1
    }
    activateQuestion(questions[nextIdx].id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm">Pertanyaan</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
        >
          {showForm ? '✕ Batal' : '+ Tambah'}
        </button>
      </div>

      {/* Presentation nav (quiz only, not exam) */}
      {!isExam && questions.length > 1 && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigateQuestion('prev')}
            className="px-2.5 py-1 rounded-lg bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 text-xs transition-colors"
          >
            ← Prev
          </button>
          <span className="text-white/20 text-xs flex-1 text-center">
            {activeId ? `${questions.findIndex((q) => q.id === activeId) + 1} / ${questions.length}` : '—'}
          </span>
          <button
            onClick={() => navigateQuestion('next')}
            className="px-2.5 py-1 rounded-lg bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 text-xs transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {isExam && questions.length > 0 && (
        <p className="text-white/30 text-xs mb-3">
          Mahasiswa akan mengerjakan {questions.length} soal secara berurutan.
        </p>
      )}

      {showForm && (
        <form onSubmit={addQuestion} className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4 mb-4 space-y-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={2}
            required
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white text-sm resize-none placeholder:text-white/20"
            placeholder="Tulis pertanyaan..."
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-white/30 mb-1 uppercase">Jenis</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white text-sm"
              >
                <option value="open">Jawaban Bebas</option>
                <option value="multiple_choice">Pilihan Ganda</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/30 mb-1 uppercase">Timer (detik)</label>
              <input
                type="number"
                min={0}
                max={300}
                value={newTimer}
                onChange={(e) => setNewTimer(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white text-sm"
                placeholder="0 = tanpa timer"
              />
            </div>
          </div>

          {newType === 'multiple_choice' && (
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-white/30 uppercase">Pilihan</label>
              {newOptions.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...newOptions]
                    opts[i] = e.target.value
                    setNewOptions(opts)
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white text-sm placeholder:text-white/20"
                  placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                />
              ))}
              <button type="button" onClick={() => setNewOptions([...newOptions, ''])} className="text-xs text-purple-400 hover:underline">
                + Tambah pilihan
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              {loading ? 'Saving...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {questions.length === 0 ? (
        <p className="text-white/20 text-sm py-6 text-center">Belum ada pertanyaan.</p>
      ) : (
        <div className="space-y-1.5">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={`rounded-xl border p-3 flex items-start gap-3 transition-all ${
                !isExam && q.is_active
                  ? 'border-purple-500/30 bg-purple-500/10'
                  : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-xs font-bold text-white/20 mt-0.5 w-5 shrink-0 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/90 leading-snug">{q.text}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] text-white/25">
                    {q.type === 'open' ? 'Bebas' : 'Pilihan ganda'}
                  </span>
                  {q.timer_seconds > 0 && (
                    <span className="text-[10px] text-amber-400/60">⏱ {q.timer_seconds}s</span>
                  )}
                  {!isExam && q.is_active && (
                    <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold">AKTIF</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {!isExam && (
                  <button
                    onClick={() => activateQuestion(q.id)}
                    className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-colors ${
                      q.is_active
                        ? 'bg-purple-500 text-white hover:bg-purple-400'
                        : 'bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {q.is_active ? 'ON' : 'OFF'}
                  </button>
                )}
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="text-[10px] px-1.5 py-1 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
