import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LiveAnswers from '@/components/LiveAnswers'

const TYPE_LABELS = { quiz: 'Quiz', feedback: 'Feedback', qa: 'Tanya Jawab' }
const TYPE_EMOJIS = { quiz: '🎯', feedback: '💬', qa: '🙋' }

export default async function DisplayPage({ params }) {
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

  const { data: initialAnswers } = await supabase
    .from('answers')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-violet-950 to-indigo-950 flex flex-col">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">
              {TYPE_EMOJIS[session.type] || '🎯'}
            </span>
            <h1 className="text-3xl font-bold text-white">{session.title}</h1>
          </div>
          {session.description && (
            <p className="text-white/50 text-base ml-12">{session.description}</p>
          )}
        </div>
        <div className="text-right shrink-0 ml-8">
          <p className="text-white/40 text-sm uppercase tracking-widest">
            Kode bergabung
          </p>
          <p className="font-mono font-black text-4xl text-white tracking-widest mt-1">
            {session.code}
          </p>
          <p className="text-white/40 text-sm mt-1">
            {session.is_active ? '🟢 Sesi aktif' : '⚫ Sesi nonaktif'}
          </p>
        </div>
      </header>

      {/* Active Question */}
      {activeQuestion && (
        <div className="mx-8 mb-4">
          <div className="bg-white/10 rounded-2xl px-6 py-4 border border-white/10">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
              Pertanyaan Aktif
            </p>
            <p className="text-white text-2xl font-semibold">
              {activeQuestion.text}
            </p>
            {activeQuestion.type === 'multiple_choice' &&
              activeQuestion.options?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeQuestion.options.map((opt, i) => (
                    <span
                      key={i}
                      className="bg-white/10 text-white px-3 py-1 rounded-full text-sm"
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </span>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Live Answers */}
      <div className="flex-1 mx-8 mb-8 overflow-hidden">
        <LiveAnswers
          sessionId={session.id}
          initialAnswers={initialAnswers || []}
        />
      </div>

      {/* Footer */}
      <footer className="px-8 pb-6 flex items-center justify-between">
        <p className="text-white/30 text-sm">Fun Quiz</p>
        <p className="text-white/30 text-sm">
          Masukkan kode{' '}
          <span className="font-mono font-bold text-white/60">{session.code}</span>{' '}
          untuk bergabung
        </p>
      </footer>
    </div>
  )
}
