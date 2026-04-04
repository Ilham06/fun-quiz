import { verifySession } from '@/lib/dal'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

const TYPE_META = {
  quiz: { label: 'Quiz', color: 'bg-purple-500/15 text-purple-300 border-purple-500/20' },
  feedback: { label: 'Feedback', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
  qa: { label: 'Tanya Jawab', color: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
}

export default async function DashboardPage() {
  await verifySession()

  const supabase = createServerClient()
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0f0a1e]">
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
              Q
            </div>
            <span className="text-white font-bold tracking-tight">funquiz</span>
            <span className="text-white/20 text-sm font-medium ml-1">/ dashboard</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Sesi Anda</h1>
            <p className="text-white/40 text-sm mt-1">Kelola quiz, feedback, dan tanya jawab</p>
          </div>
          <Link
            href="/dashboard/sessions/new"
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            + Buat Sesi
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-white/50 font-medium">Belum ada sesi.</p>
            <p className="text-white/25 text-sm mt-1">Buat sesi pertama untuk memulai.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session, i) => {
              const meta = TYPE_META[session.type] || TYPE_META.quiz
              return (
                <Link
                  key={session.id}
                  href={`/dashboard/sessions/${session.id}`}
                  className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-2xl p-5 transition-all"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                      {meta.label}
                    </span>
                    {session.is_active && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                    {session.title}
                  </h3>
                  {session.description && (
                    <p className="text-white/30 text-sm line-clamp-2 mt-1">{session.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-xs bg-white/5 text-white/50 px-2 py-1 rounded-lg tracking-widest">
                      {session.code}
                    </span>
                    <span className="text-white/20 text-xs">
                      {new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
