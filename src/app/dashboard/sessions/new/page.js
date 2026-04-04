'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SESSION_TYPES = [
  { value: 'quiz', label: 'Quiz', icon: '🧠', desc: 'Pertanyaan & jawaban' },
  { value: 'feedback', label: 'Feedback', icon: '💬', desc: 'Pesan, kesan, kritik, saran' },
  { value: 'qa', label: 'Tanya Jawab', icon: '🙋', desc: 'Q&A interaktif' },
]

const THEMES = [
  { value: 'default', label: 'Default', gradient: 'from-purple-600 to-indigo-700' },
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
    <div className="min-h-screen bg-[#0f0a1e]">
      <header className="border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-white/30 hover:text-white/60 transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-white/10">|</span>
          <h1 className="text-white font-semibold text-sm">Buat Sesi Baru</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Judul Sesi
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white placeholder:text-white/20 transition-colors"
                placeholder="Quiz Bab 3, Pesan & Kesan, dll."
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Deskripsi
                <span className="text-white/20 font-normal normal-case ml-1">opsional</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                maxLength={300}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-400 focus:outline-none text-white placeholder:text-white/20 transition-colors resize-none"
                placeholder="Deskripsi singkat..."
              />
            </div>
          </div>

          {/* Session Type */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider">Jenis Sesi</p>
            <div className="grid grid-cols-3 gap-2">
              {SESSION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    type === t.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/5 hover:border-white/10 bg-transparent'
                  }`}
                >
                  <div className="text-xl mb-1">{t.icon}</div>
                  <div className="text-white text-sm font-semibold">{t.label}</div>
                  <div className="text-white/30 text-xs mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider">Tema Visual</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={`rounded-xl overflow-hidden border-2 transition-all ${
                    theme === t.value ? 'border-white ring-1 ring-white/20' : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className={`h-10 bg-gradient-to-br ${t.gradient}`} />
                  <div className="py-1.5 text-center text-[10px] text-white/60 font-medium">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm animate-fade-up">{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors text-sm font-medium"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold transition-colors text-sm"
            >
              {loading ? 'Membuat...' : 'Buat Sesi'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
