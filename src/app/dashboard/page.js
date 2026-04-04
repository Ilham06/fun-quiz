import { verifySession } from '@/lib/dal'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

const TYPE_LABELS = {
  quiz: 'Quiz',
  feedback: 'Feedback',
  qa: 'Tanya Jawab',
}

const TYPE_COLORS = {
  quiz: 'bg-violet-100 text-violet-700',
  feedback: 'bg-emerald-100 text-emerald-700',
  qa: 'bg-amber-100 text-amber-700',
}

export default async function DashboardPage() {
  await verifySession()

  const supabase = createServerClient()
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h1 className="text-xl font-bold text-gray-900">Fun Quiz</h1>
            <span className="text-sm text-gray-400 ml-1">Dashboard</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sesi Quiz</h2>
          <Link
            href="/dashboard/sessions/new"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <span>+</span> Buat Sesi Baru
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg">Belum ada sesi quiz.</p>
            <p className="text-sm mt-1">Buat sesi pertama Anda!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/sessions/${session.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-violet-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[session.type] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {TYPE_LABELS[session.type] || session.type}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${session.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {session.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors mb-1">
                  {session.title}
                </h3>
                {session.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {session.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded-lg text-gray-600">
                    {session.code}
                  </span>
                  <span className="text-xs text-gray-400">kode bergabung</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
