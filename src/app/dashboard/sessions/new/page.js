'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SESSION_TYPES = [
  {
    value: 'quiz',
    label: 'Quiz',
    emoji: '🎯',
    desc: 'Pertanyaan dengan jawaban tertulis',
  },
  {
    value: 'feedback',
    label: 'Pesan & Kesan',
    emoji: '💬',
    desc: 'Kumpulkan pesan, kesan, kritik, dan saran',
  },
  {
    value: 'qa',
    label: 'Tanya Jawab',
    emoji: '🙋',
    desc: 'Sesi tanya jawab interaktif',
  },
]

export default function NewSessionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState('quiz')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title')
    const description = formData.get('description')

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, type }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/sessions/${data.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Gagal membuat sesi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Kembali
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-semibold text-gray-900">Buat Sesi Baru</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Informasi Sesi</h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Judul Sesi <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900"
                  placeholder="Contoh: Quiz Bab 3 - Sistem Persamaan"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Deskripsi <span className="text-gray-400">(opsional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 resize-none"
                  placeholder="Deskripsi singkat tentang sesi ini"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Jenis Sesi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SESSION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    type === t.value
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{t.emoji}</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {t.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {loading ? 'Membuat...' : 'Buat Sesi →'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
