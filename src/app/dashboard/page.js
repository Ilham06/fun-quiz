import { verifySession } from '@/lib/dal'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

const TYPE_META = {
  quiz: { label: 'Quiz', color: 'bg-amber-50 text-amber-700 border-amber-200', statusLabel: 'Quiz Aktif' },
  exam: { label: 'Ujian', color: 'bg-orange-50 text-orange-700 border-orange-200', statusLabel: 'Ujian Aktif' },
  feedback: { label: 'Feedback', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', statusLabel: 'Feedback' },
  qa: { label: 'Tanya Jawab', color: 'bg-sky-50 text-sky-700 border-sky-200', statusLabel: 'Tanya Jawab' },
}

const TYPE_ICONS = {
  quiz: '🧠',
  exam: '📝',
  feedback: '💬',
  qa: '🙋',
}

export default async function DashboardPage() {
  await verifySession()

  const supabase = createServerClient()

  const [
    { data: sessions },
    { count: totalAnswers },
    { data: recentAnswers },
  ] = await Promise.all([
    supabase.from('sessions').select('*').order('created_at', { ascending: false }),
    supabase.from('answers').select('*', { count: 'exact', head: true }),
    supabase.from('answers').select('student_name, content, created_at, session_id').order('created_at', { ascending: false }).limit(6),
  ])

  const allSessions = sessions || []
  const totalSessions = allSessions.length
  const activeSessions = allSessions.filter(s => s.is_active).length
  const participantCount = totalAnswers || 0

  const sessionMap = {}
  for (const s of allSessions) sessionMap[s.id] = s

  const recentActivities = (recentAnswers || []).map(a => ({
    studentName: a.student_name || 'Anonim',
    content: a.content,
    sessionTitle: sessionMap[a.session_id]?.title || 'Sesi',
    time: a.created_at,
  }))

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Baru saja'
    if (mins < 60) return `${mins} menit lalu`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} jam lalu`
    const days = Math.floor(hours / 24)
    return `${days} hari lalu`
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-amber-500/20">
              Q
            </div>
            <span className="text-gray-900 font-extrabold text-lg tracking-tight">funquiz</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-12">
        {/* Welcome Header — per Stitch design */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
              Selamat Datang, Pengajar 👋
            </h1>
            <p className="text-gray-500 text-lg">Kelola semua sesi quiz, ujian, dan feedback Anda</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/dashboard/sessions/new"
              className="px-6 py-3 bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-all flex items-center gap-2 text-sm"
            >
              <span className="text-base">＋</span>
              Buat Sesi Baru
            </Link>
          </div>
        </div>

        {/* Stats Grid — 4 cards per Stitch */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Sesi */}
          <div className="bg-white p-6 rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.02)] border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gray-100 p-3 rounded-xl text-amber-600">
                <span className="text-xl">📋</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold tracking-wider uppercase mb-1">Total Sesi</p>
            <h3 className="text-3xl font-bold text-gray-900">{totalSessions}</h3>
          </div>

          {/* Sesi Aktif */}
          <div className="bg-white p-6 rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.02)] border border-gray-200 relative overflow-hidden">
            {activeSessions > 0 && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Active</span>
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                <span className="text-xl">⚡</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold tracking-wider uppercase mb-1">Sesi Aktif</p>
            <h3 className="text-3xl font-bold text-gray-900">{activeSessions}</h3>
          </div>

          {/* Total Jawaban */}
          <div className="bg-white p-6 rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.02)] border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-sky-50 p-3 rounded-xl text-sky-600">
                <span className="text-xl">👥</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold tracking-wider uppercase mb-1">Total Jawaban</p>
            <h3 className="text-3xl font-bold text-gray-900">{participantCount.toLocaleString('id-ID')}</h3>
          </div>

          {/* Jenis Sesi */}
          <div className="bg-white p-6 rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.02)] border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                <span className="text-xl">⭐</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold tracking-wider uppercase mb-1">Jenis Sesi</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900">
                {new Set(allSessions.map(s => s.type)).size}
              </h3>
              <span className="text-gray-400 text-xs font-bold">tipe aktif</span>
            </div>
          </div>
        </section>

        {/* Main Content Split — 2/3 + 1/3 per Stitch */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column: Sesi Terbaru (2/3) */}
          <section className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">Sesi Terbaru</h2>
              {allSessions.length > 5 && (
                <span className="text-amber-600 font-bold text-sm">
                  {allSessions.length} sesi
                </span>
              )}
            </div>

            {allSessions.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
                  <span className="text-3xl">📋</span>
                </div>
                <p className="text-gray-500 font-medium">Belum ada sesi.</p>
                <p className="text-gray-400 text-sm mt-1">Buat sesi pertama untuk memulai.</p>
              </div>
            ) : (
              allSessions.slice(0, 8).map((session) => {
                const meta = TYPE_META[session.type] || TYPE_META.quiz
                const icon = TYPE_ICONS[session.type] || '🧠'
                return (
                  <Link
                    key={session.id}
                    href={`/dashboard/sessions/${session.id}`}
                    className="bg-white p-5 rounded-2xl border border-gray-200 flex gap-5 items-center group hover:shadow-md transition-all"
                  >
                    {/* Icon thumbnail */}
                    <div className="w-28 h-20 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                      <span className="text-4xl">{icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {session.is_active ? (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${meta.color} border`}>
                            {meta.statusLabel} — LIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase border border-gray-200">
                            {meta.label}
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                        {session.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <span>🔑</span>
                          <span className="font-mono tracking-wider">{session.code}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <span>📅</span>
                          {new Date(session.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Action hint */}
                    <div className="shrink-0 hidden sm:flex">
                      <span className="px-4 py-2 border border-gray-200 text-gray-500 font-bold text-sm rounded-lg group-hover:bg-gray-50 transition-colors">
                        Kelola →
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </section>

          {/* Column: Aktivitas Terbaru (1/3) — per Stitch */}
         
        </div>
      </main>
    </div>
  )
}
