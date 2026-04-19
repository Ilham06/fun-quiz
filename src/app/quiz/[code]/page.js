import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AnswerForm from '@/components/AnswerForm'
import EmojiReactionBar from '@/components/EmojiReactionBar'
import LiveAnswers from '@/components/LiveAnswers'
import ExamFlow from '@/components/ExamFlow'
import { getThemeConfig } from '@/lib/themes'

export default async function QuizPage({ params }) {
  const { code } = await params

  const session = await prisma.session.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!session) notFound()

  const questions = await prisma.question.findMany({
    where: { session_id: session.id },
    orderBy: { order: 'asc' },
  })

  const theme = getThemeConfig(session.theme)

  if (session.type === 'exam') {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#f8f9fa] flex flex-col text-gray-900 antialiased">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center w-full px-4 md:px-8 h-14 md:h-16 shadow-sm border-b border-gray-200">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <span className="text-amber-600 font-black text-xl md:text-2xl tracking-tighter shrink-0">FunQuiz</span>
            <div className="h-5 w-[1px] bg-gray-200 hidden md:block" />
            <span className="font-semibold text-gray-900 hidden md:inline truncate max-w-[260px]">{session.title}</span>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
            Quiz • {session.code}
          </span>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-5 md:py-12">
          <ExamFlow session={session} questions={questions || []} theme={theme} />
        </main>
      </div>
    )
  }

  /* ── Discussion / Quiz type — Stitch "Premium Discussion Input" ── */
  const activeQuestion = questions?.find((q) => q.is_active) || null

  const answersWhere = { session_id: session.id }
  if (activeQuestion) {
    answersWhere.question_id = activeQuestion.id
  } else {
    answersWhere.question_id = null
  }

  const answers = await prisma.answer.findMany({
    where: answersWhere,
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f8f9fa] text-[#191c1d] antialiased">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center w-full px-4 md:px-8 h-14 md:h-16 max-w-3xl mx-auto">
          <span className="text-amber-600 font-black text-xl md:text-2xl tracking-tighter">FunQuiz</span>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {session.code}
          </span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-3 md:px-4 py-6 md:py-12">
        {!session.is_active ? (
          <div className="text-center py-16 md:py-20 animate-fade-up">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
              <span className="text-2xl md:text-3xl">⏳</span>
            </div>
            <h2 className="text-base md:text-lg font-bold text-gray-900 mb-1">Sesi belum dimulai</h2>
            <p className="text-gray-500 text-sm">Tunggu pengajar mengaktifkan sesi.</p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8 animate-fade-up">
            <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-[0px_12px_32px_rgba(25,28,29,0.04)] overflow-hidden">
              <div className="p-5 md:p-12">
                <div className="mb-6 md:mb-10">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-full">
                      <span className="text-[0.65rem] md:text-[0.7rem] font-bold tracking-widest text-gray-500 uppercase">Diskusi</span>
                    </div>
                    <div className="bg-amber-500/10 px-3 py-1.5 rounded-lg md:rounded-xl text-center shrink-0">
                      <span className="text-xs md:text-lg font-black text-amber-700 tracking-widest">{session.code}</span>
                    </div>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                    {session.title}
                  </h1>
                  {session.description && (
                    <p className="text-gray-500 text-sm mt-1.5 md:mt-2">{session.description}</p>
                  )}
                </div>

                {activeQuestion && (
                  <div className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2">Pertanyaan</p>
                    <p className="text-gray-900 font-semibold text-base md:text-lg leading-snug">{activeQuestion.text}</p>
                  </div>
                )}

                <AnswerForm session={session} activeQuestion={activeQuestion} theme={theme} />
              </div>
            </div>

            <div className="flex justify-center -mt-10 md:-mt-14 relative z-10">
              <EmojiReactionBar sessionId={session.id} />
            </div>

            {(answers?.length || 0) > 0 && (
              <section className="mt-4 md:mt-8 space-y-4 md:space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    💬 Jawaban Terbaru
                  </h2>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    {answers.length} jawaban
                  </span>
                </div>
                <LiveAnswers
                  sessionId={session.id}
                  questionId={activeQuestion?.id || null}
                  initialAnswers={answers || []}
                  showLikes={true}
                  compact={true}
                  variant="light"
                />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
