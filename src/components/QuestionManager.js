'use client'
import { useState } from 'react'

export default function QuestionManager({ sessionId, initialQuestions = [] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [showForm, setShowForm] = useState(false)
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState('open')
  const [newOptions, setNewOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [activeId, setActiveId] = useState(
    initialQuestions.find((q) => q.is_active)?.id || null
  )

  async function addQuestion(e) {
    e.preventDefault()
    if (!newText.trim()) return
    setLoading(true)

    const options =
      newType === 'multiple_choice'
        ? newOptions.filter((o) => o.trim())
        : null

    const res = await fetch(`/api/sessions/${sessionId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: newText,
        type: newType,
        options,
        order: questions.length,
      }),
    })

    if (res.ok) {
      const q = await res.json()
      setQuestions((prev) => [...prev, q])
      setNewText('')
      setNewType('open')
      setNewOptions(['', ''])
      setShowForm(false)
    }
    setLoading(false)
  }

  async function deleteQuestion(id) {
    if (!confirm('Hapus pertanyaan ini?')) return
    const res = await fetch(
      `/api/sessions/${sessionId}/questions/${id}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      if (activeId === id) setActiveId(null)
    }
  }

  async function toggleActive(id) {
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
    setQuestions((prev) =>
      prev.map((q) => ({ ...q, is_active: q.id === nextActive }))
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Pertanyaan</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm text-violet-600 hover:text-violet-800 font-medium"
        >
          {showForm ? '✕ Batal' : '+ Tambah Pertanyaan'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addQuestion}
          className="bg-violet-50 rounded-xl p-4 mb-4 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Teks Pertanyaan
            </label>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={2}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 text-sm resize-none"
              placeholder="Tulis pertanyaan..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Jenis Jawaban
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 text-sm"
            >
              <option value="open">Jawaban Bebas</option>
              <option value="multiple_choice">Pilihan Ganda</option>
            </select>
          </div>

          {newType === 'multiple_choice' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600">
                Pilihan Jawaban
              </label>
              {newOptions.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...newOptions]
                    opts[i] = e.target.value
                    setNewOptions(opts)
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 text-sm"
                  placeholder={`Pilihan ${i + 1}`}
                />
              ))}
              <button
                type="button"
                onClick={() => setNewOptions([...newOptions, ''])}
                className="text-xs text-violet-600 hover:underline"
              >
                + Tambah pilihan
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {questions.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          Belum ada pertanyaan. Tambahkan pertanyaan pertama!
        </p>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={`rounded-xl border p-3 flex items-start gap-3 ${
                q.is_active
                  ? 'border-violet-300 bg-violet-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{q.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {q.type === 'open' ? 'Jawaban bebas' : 'Pilihan ganda'}
                  </span>
                  {q.is_active && (
                    <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => toggleActive(q.id)}
                  title={q.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                    q.is_active
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {q.is_active ? 'Aktif' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  title="Hapus"
                  className="text-xs px-2 py-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
