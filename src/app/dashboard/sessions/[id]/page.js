import { verifySession, getPermissions } from '@/lib/dal'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionControls from '@/components/SessionControls'
import QuestionManager from '@/components/QuestionManager'
import LogoutButton from '@/components/LogoutButton'
import ViolationsPanel from '@/components/ViolationsPanel'
import ExamAnswersByStudent from '@/components/ExamAnswersByStudent'
import ShuffleSettings from '@/components/ShuffleSettings'

const TYPE_META = {
  quiz: { label: 'Quiz', icon: '🧠' },
  exam: { label: 'Ujian', icon: '📝' },
  feedback: { label: 'Feedback', icon: '💬' },
  qa: { label: 'Tanya Jawab', icon: '🙋' },
}

export default async function SessionDetailPage({ params }) {
  const { userId } = await verifySession()
  const perms = await getPermissions()

  const { id } = await params

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) notFound()
  if (!perms.includes('view_all_sessions') && session.user_id !== userId) notFound()

  const questions = await prisma.question.findMany({
    where: { session_id: id },
    orderBy: { order: 'asc' },
  })

  const answers = await prisma.answer.findMany({
    where: { session_id: id },
    orderBy: { created_at: 'desc' },
    ...(session.type !== 'exam' ? { take: 50 } : {}),
  })

  let violations = []
  if (session.type === 'exam') {
    violations = await prisma.tabViolation.findMany({
      where: { session_id: id },
      orderBy: { created_at: 'desc' },
    })
  }

  const meta = TYPE_META[session.type] || TYPE_META.quiz

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <nav className="w-full bg-white border-b border-gray-100 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-4 text-sm font-medium">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
            Dashboard
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-900 font-bold uppercase tracking-wider truncate max-w-[300px]">{session.title}</span>
        </div>
        <LogoutButton />
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-6 space-y-6">
        <section className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-2xl">{meta.icon}</span>
              </div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{session.title}</h1>
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {meta.label}
                </span>
              </div>
            </div>
            <SessionControls sessionId={id} initialActive={session.is_active} />
          </div>

          {session.description && (
            <p className="text-gray-500 text-sm mb-5 ml-[52px]">{session.description}</p>
          )}

          <div className="flex items-center space-x-4 ml-[52px]">
            <div className="flex items-center bg-amber-400 rounded-xl px-6 py-3 space-x-3">
              <span className="text-sm font-semibold opacity-70">Kode:</span>
              <span className="text-2xl font-black tracking-[0.2em]">{session.code}</span>
            </div>
            <a
              href={`/display/${session.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-500 rounded-xl font-bold text-sm shadow-sm transition-all"
            >
              Display diskusi
            </a>
          </div>
        </section>

        {session.type === 'exam' && (
          <ShuffleSettings
            sessionId={id}
            initialShuffleQuestions={session.shuffle_questions ?? false}
            initialShuffleOptions={session.shuffle_options ?? false}
            initialQuizMode={session.quiz_mode ?? 'one_by_one'}
          />
        )}

        {session.type === 'exam' && violations.length > 0 && (
          <ViolationsPanel violations={violations} questions={questions || []} />
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100">
            <QuestionManager sessionId={id} initialQuestions={questions || []} sessionType={session.type} />
          </div>

          <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100">
            {session.type === 'exam' ? (
              <ExamAnswersByStudent answers={answers || []} questions={questions || []} sessionName={session.title} />
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 text-sm">
                    Jawaban Masuk
                    <span className="text-gray-400 font-medium ml-1.5">({answers?.length || 0})</span>
                  </h3>
                </div>
                {!answers || answers.length === 0 ? (
                  <p className="text-gray-400 text-sm py-8 text-center">Belum ada jawaban.</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
                    {answers.map((a) => (
                      <div key={a.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors">
                        <p className="text-gray-800 text-sm">{a.content}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-gray-400 text-xs">
                            {a.student_name || 'Anonim'} · {new Date(a.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {a.upvotes > 0 && (
                            <span className="text-xs font-bold text-amber-500">▲ {a.upvotes}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
