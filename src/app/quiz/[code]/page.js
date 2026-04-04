import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AnswerForm from '@/components/AnswerForm'

export default async function QuizPage({ params }) {
  const { code } = await params
  const supabase = createServerClient()

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !session) {
    notFound()
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', session.id)
    .order('order', { ascending: true })

  const activeQuestion = questions?.find((q) => q.is_active) || null

  const TYPE_LABELS = { quiz: 'Quiz', feedback: 'Feedback', qa: 'Tanya Jawab' }
  const TYPE_EMOJIS = { quiz: '🎯', feedback: '💬', qa: '🙋' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 flex flex-col">
      <header className="bg-white/80 backdrop-blur border-b border-white/50">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-xl">{TYPE_EMOJIS[session.type] || '🎯'}</span>
          <div>
            <h1 className="font-bold text-gray-900">{session.title}</h1>
            <span className="text-xs text-gray-400">
              {TYPE_LABELS[session.type]}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8">
        {!session.is_active ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Sesi belum dimulai
            </h2>
            <p className="text-gray-500">
              Tunggu pengajar mengaktifkan sesi ini.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Question display */}
            {activeQuestion ? (
              <div className="bg-white rounded-2xl shadow-sm border border-white p-6">
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2">
                  Pertanyaan
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {activeQuestion.text}
                </p>
              </div>
            ) : session.description ? (
              <div className="bg-white rounded-2xl shadow-sm border border-white p-6">
                <p className="text-sm text-gray-600">{session.description}</p>
              </div>
            ) : null}

            {/* Answer form */}
            <div className="bg-white rounded-2xl shadow-sm border border-white p-6">
              <AnswerForm
                session={session}
                activeQuestion={activeQuestion}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
