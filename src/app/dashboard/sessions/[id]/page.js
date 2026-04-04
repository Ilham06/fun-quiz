import { verifySession } from '@/lib/dal'
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionControls from '@/components/SessionControls'
import QuestionManager from '@/components/QuestionManager'
import LogoutButton from '@/components/LogoutButton'

export default async function SessionDetailPage({ params }) {
  await verifySession()

  const { id } = await params
  const supabase = createServerClient()

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !session) {
    notFound()
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', id)
    .order('order', { ascending: true })

  const { data: answers } = await supabase
    .from('answers')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  const TYPE_LABELS = { quiz: 'Quiz', feedback: 'Feedback', qa: 'Tanya Jawab' }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
            >
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-semibold text-gray-900 truncate max-w-xs">
              {session.title}
            </h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Session Info & Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{session.title}</h2>
                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {TYPE_LABELS[session.type] || session.type}
                </span>
              </div>
              {session.description && (
                <p className="text-gray-500 text-sm">{session.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm text-gray-500">Kode bergabung:</span>
                  <span className="font-mono font-bold text-gray-900 text-lg tracking-widest">
                    {session.code}
                  </span>
                </div>
                <a
                  href={`/display/${session.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                >
                  📺 Layar Proyektor
                </a>
              </div>
            </div>
            <SessionControls sessionId={id} initialActive={session.is_active} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Questions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <QuestionManager
              sessionId={id}
              initialQuestions={questions || []}
            />
          </div>

          {/* Live Answers Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                Jawaban Masuk{' '}
                <span className="text-gray-400 font-normal text-sm">
                  ({answers?.length || 0})
                </span>
              </h3>
            </div>
            {!answers || answers.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Belum ada jawaban masuk.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {answers.map((a) => (
                  <div key={a.id} className="rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-sm text-gray-900">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {a.student_name || 'Anonim'} &middot;{' '}
                      {new Date(a.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
