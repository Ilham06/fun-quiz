import { verifySession } from '@/lib/dal'
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionControls from '@/components/SessionControls'
import QuestionManager from '@/components/QuestionManager'
import LogoutButton from '@/components/LogoutButton'

const TYPE_META = {
  quiz: { label: 'Quiz', icon: '🧠' },
  exam: { label: 'Ujian', icon: '📝' },
  feedback: { label: 'Feedback', icon: '💬' },
  qa: { label: 'Tanya Jawab', icon: '🙋' },
}

export default async function SessionDetailPage({ params }) {
  await verifySession()

  const { id } = await params
  const supabase = createServerClient()

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !session) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', id)
    .order('order', { ascending: true })

  let answersQuery = supabase
    .from('answers')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: false })

  if (session.type !== 'exam') {
    answersQuery = answersQuery.limit(50)
  }

  const { data: answers } = await answersQuery

  const meta = TYPE_META[session.type] || TYPE_META.quiz

  return (
    <div className="min-h-screen bg-[#0f0a1e]">
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-white/30 hover:text-white/60 transition-colors text-sm">
              ← Dashboard
            </Link>
            <span className="text-white/10">|</span>
            <span className="text-white font-semibold text-sm truncate max-w-[200px]">{session.title}</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Session info bar */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xl">{meta.icon}</span>
                <h2 className="text-xl font-bold text-white">{session.title}</h2>
                <span className="text-[10px] font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                  {meta.label}
                </span>
              </div>
              {session.description && (
                <p className="text-white/40 text-sm ml-8">{session.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 ml-8">
                <div className="bg-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-white/30 text-xs">Kode:</span>
                  <span className="font-mono font-bold text-white text-lg tracking-widest">{session.code}</span>
                </div>
                <a
                  href={`/display/${session.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                >
                  Buka Layar Proyektor
                </a>
              </div>
            </div>
            <SessionControls sessionId={id} initialActive={session.is_active} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Questions */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <QuestionManager sessionId={id} initialQuestions={questions || []} sessionType={session.type} />
          </div>

          {/* Answers preview */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">
                Jawaban Masuk
                <span className="text-white/30 font-normal ml-1.5">({answers?.length || 0})</span>
              </h3>
            </div>
            {!answers || answers.length === 0 ? (
              <p className="text-white/25 text-sm py-8 text-center">Belum ada jawaban.</p>
            ) : session.type === 'exam' ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
                {(questions || []).map((q, qi) => {
                  const qAnswers = answers.filter(a => a.question_id === q.id)
                  return (
                    <div key={q.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                          Soal {qi + 1}
                        </span>
                        <span className="text-white/30 text-xs truncate">{q.text}</span>
                        <span className="text-white/20 text-xs ml-auto shrink-0">{qAnswers.length} jawaban</span>
                      </div>
                      {qAnswers.length === 0 ? (
                        <p className="text-white/15 text-xs pl-2 mb-2">Belum ada jawaban.</p>
                      ) : (
                        <div className="space-y-1.5 mb-2">
                          {qAnswers.map((a) => (
                            <div key={a.id} className="bg-white/[0.04] rounded-xl px-3.5 py-2.5">
                              <p className="text-white/90 text-sm">{a.content}</p>
                              <p className="text-white/30 text-xs mt-1">
                                {a.student_name || 'Anonim'} · {new Date(a.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin">
                {answers.map((a) => (
                  <div key={a.id} className="bg-white/[0.04] rounded-xl px-3.5 py-2.5">
                    <p className="text-white/90 text-sm">{a.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-white/30 text-xs">
                        {a.student_name || 'Anonim'} · {new Date(a.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {a.upvotes > 0 && (
                        <span className="text-xs text-yellow-400/80">▲ {a.upvotes}</span>
                      )}
                    </div>
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
