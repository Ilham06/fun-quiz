import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AnswerForm from '@/components/AnswerForm'
import EmojiReactionBar from '@/components/EmojiReactionBar'
import LiveAnswers from '@/components/LiveAnswers'
import ExamFlow from '@/components/ExamFlow'
import { getThemeConfig } from '@/lib/themes'

export default async function QuizPage({ params }) {
  const { code } = await params
  const supabase = createServerClient()

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !session) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', session.id)
    .order('order', { ascending: true })

  const theme = getThemeConfig(session.theme)

  if (session.type === 'exam') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col text-gray-900 antialiased">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center w-full px-6 md:px-8 h-16 shadow-sm border-b border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-amber-600 font-black text-2xl tracking-tighter">FunQuiz</span>
            <div className="h-6 w-[1px] bg-gray-200 hidden md:block" />
            <span className="font-semibold text-gray-900 hidden md:inline truncate max-w-[260px]">{session.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full uppercase tracking-wider">
              Ujian • {session.code}
            </span>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 md:py-12">
          <ExamFlow session={session} questions={questions || []} theme={theme} />
        </main>
      </div>
    )
  }

  /* ── Discussion / Quiz type — Stitch "Premium Discussion Input" ── */
  const activeQuestion = questions?.find((q) => q.is_active) || null

  let answersQuery = supabase
    .from('answers')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })

  if (activeQuestion) {
    answersQuery = answersQuery.eq('question_id', activeQuestion.id)
  } else {
    answersQuery = answersQuery.is('question_id', null)
  }

  const { data: answers } = await answersQuery

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] antialiased">
      {/* Stitch: Sticky TopNavBar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center w-full px-6 md:px-8 h-16 max-w-3xl mx-auto">
          <span className="text-amber-600 font-black text-2xl tracking-tighter">FunQuiz</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {session.code}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {!session.is_active ? (
          <div className="text-center py-20 animate-fade-up">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
              <span className="text-3xl">⏳</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Sesi belum dimulai</h2>
            <p className="text-gray-500 text-sm">Tunggu pengajar mengaktifkan sesi.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-up">
            {/* Stitch: Premium Discussion Card */}
            <div className="bg-white rounded-[2rem] shadow-[0px_12px_32px_rgba(25,28,29,0.04)] overflow-hidden">
              <div className="p-8 md:p-12">
                {/* Header: Badge + Title + Code */}
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full mb-3">
                      <span className="text-[0.7rem] font-bold tracking-widest text-gray-500 uppercase">Diskusi Interaktif</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                      {session.title}
                    </h1>
                    {session.description && (
                      <p className="text-gray-500 text-sm mt-2 max-w-md">{session.description}</p>
                    )}
                  </div>
                  <div className="bg-amber-500/10 px-4 py-2 rounded-xl text-center shrink-0 ml-4">
                    <span className="block text-[0.6rem] font-bold text-amber-700 uppercase tracking-tight">Kode</span>
                    <span className="text-lg font-black text-amber-700 tracking-widest">{session.code}</span>
                  </div>
                </div>

                {/* Active question display */}
                {activeQuestion && (
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pertanyaan</p>
                    <p className="text-gray-900 font-semibold text-lg leading-snug">{activeQuestion.text}</p>
                  </div>
                )}

                {/* Answer Form */}
                <AnswerForm session={session} activeQuestion={activeQuestion} theme={theme} />
              </div>
            </div>

            {/* Stitch: Floating Emoji Reaction Bar */}
            <div className="flex justify-center -mt-14 relative z-10">
              <EmojiReactionBar sessionId={session.id} />
            </div>

            {/* Stitch: Recent Answers Feed */}
            {(answers?.length || 0) > 0 && (
              <section className="mt-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    💬 Jawaban Terbaru
                  </h2>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
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
