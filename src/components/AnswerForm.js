'use client'
import { useState } from 'react'

export default function AnswerForm({ session, activeQuestion }) {
  const [name, setName] = useState('')
  const [isAnon, setIsAnon] = useState(false)
  const [content, setContent] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const answerContent =
      activeQuestion?.type === 'multiple_choice' && selectedOption !== null
        ? selectedOption
        : content

    if (!answerContent?.trim()) {
      setError('Jawaban tidak boleh kosong.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        question_id: activeQuestion?.id || null,
        student_name: isAnon ? null : name,
        content: answerContent,
      }),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Gagal mengirim jawaban.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Jawaban terkirim!
        </h2>
        <p className="text-gray-500">Terima kasih, {isAnon ? 'Anonim' : name || 'teman'}!</p>
        <button
          onClick={() => {
            setSubmitted(false)
            setContent('')
            setSelectedOption(null)
          }}
          className="mt-6 text-sm text-violet-600 hover:underline"
        >
          Kirim jawaban lagi
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name input */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Nama Kamu
          </label>
          <button
            type="button"
            onClick={() => setIsAnon((v) => !v)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              isAnon
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {isAnon ? '👤 Anonim' : 'Anonim?'}
          </button>
        </div>
        {!isAnon && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 bg-white"
            placeholder="Tulis namamu..."
          />
        )}
      </div>

      {/* Answer input */}
      {activeQuestion ? (
        <div>
          {activeQuestion.type === 'multiple_choice' &&
          activeQuestion.options?.length > 0 ? (
            <div className="space-y-2">
              {activeQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedOption === opt
                      ? 'border-violet-500 bg-violet-50 text-violet-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-900'
                  }`}
                >
                  <span className="font-medium">
                    {String.fromCharCode(65 + i)}.
                  </span>{' '}
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 resize-none"
              placeholder="Tulis jawabanmu di sini..."
            />
          )}
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 resize-none"
          placeholder="Tulis pesan atau jawabanmu di sini..."
        />
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
      >
        {loading ? 'Mengirim...' : 'Kirim Jawaban 🚀'}
      </button>
    </form>
  )
}
