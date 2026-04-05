'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SESSION_TYPES = [
  { value: 'quiz', label: 'Diskusi', icon: '💬', desc: 'Pertanyaan terbuka, feedback, Q&A interaktif' },
  { value: 'exam', label: 'Quiz / Ujian', icon: '📝', desc: 'Soal berurutan, mahasiswa mengerjakan sendiri' },
]

const THEMES = [
  { value: 'default', label: 'Default', gradient: 'from-amber-500 to-yellow-500' },
  { value: 'ocean', label: 'Ocean', gradient: 'from-cyan-600 to-blue-700' },
  { value: 'sunset', label: 'Sunset', gradient: 'from-orange-500 to-rose-600' },
  { value: 'forest', label: 'Forest', gradient: 'from-emerald-600 to-teal-700' },
  { value: 'midnight', label: 'Midnight', gradient: 'from-slate-700 to-zinc-900' },
  { value: 'candy', label: 'Candy', gradient: 'from-pink-500 to-violet-600' },
]

export default function NewSessionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState('quiz')
  const [theme, setTheme] = useState('default')

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
      body: JSON.stringify({ title, description, type, theme }),
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
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-gray-200">|</span>
          <h1 className="text-gray-900 font-semibold text-sm">Buat Sesi Baru</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Judul Sesi
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:outline-none text-gray-900 placeholder:text-gray-400 transition-colors"
                placeholder="Quiz Bab 3, Pesan & Kesan, dll."
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Deskripsi
                <span className="text-gray-300 font-normal normal-case ml-1">opsional</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                maxLength={300}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:outline-none text-gray-900 placeholder:text-gray-400 transition-colors resize-none"
                placeholder="Deskripsi singkat..."
              />
            </div>
          </div>

          {/* Session Type */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Jenis Sesi</p>
            <div className="grid grid-cols-2 gap-3">
              {SESSION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    type === t.value
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xl mb-1">{t.icon}</div>
                  <div className="text-gray-900 text-sm font-semibold">{t.label}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Tema Visual</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={`rounded-xl overflow-hidden border-2 transition-all ${
                    theme === t.value ? 'border-gray-300 ring-1 ring-gray-200' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`h-10 bg-gradient-to-br ${t.gradient}`} />
                  <div className="py-1.5 text-center text-[10px] text-gray-500 font-medium bg-white">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm animate-fade-up">{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium bg-white shadow-sm"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold transition-colors text-sm shadow-sm"
            >
              {loading ? 'Membuat...' : 'Buat Sesi'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
