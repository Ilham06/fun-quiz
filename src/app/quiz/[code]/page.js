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
      <div className={`min-h-screen bg-gradient-to-br ${theme.bg} flex flex-col`}>
        <header className="px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className={`w-8 h-8 bg-gradient-to-br ${theme.accent} rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg`}>
              U
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-sm truncate">{session.title}</h1>
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-xs">{session.code}</span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full">UJIAN</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-8">
          <ExamFlow session={session} questions={questions || []} theme={theme} />
        </main>
      </div>
    )
  }

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
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} flex flex-col`}>
      <header className="px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className={`w-8 h-8 bg-gradient-to-br ${theme.accent} rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg`}>
            Q
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-sm truncate">{session.title}</h1>
            <span className="text-white/30 text-xs">{session.code}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-8">
        {!session.is_active ? (
          <div className="text-center py-20 animate-fade-up">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Sesi belum dimulai</h2>
            <p className="text-white/40 text-sm">Tunggu pengajar mengaktifkan sesi.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {activeQuestion && (
              <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Pertanyaan</p>
                <p className="text-white font-semibold text-lg leading-snug">{activeQuestion.text}</p>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5">
              <AnswerForm session={session} activeQuestion={activeQuestion} theme={theme} />
            </div>

            <EmojiReactionBar sessionId={session.id} />

            {(answers?.length || 0) > 0 && (
              <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Jawaban terbaru</p>
                <LiveAnswers sessionId={session.id} questionId={activeQuestion?.id || null} initialAnswers={answers || []} showLikes={true} compact={true} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
