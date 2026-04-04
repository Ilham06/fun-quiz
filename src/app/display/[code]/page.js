import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getThemeConfig } from '@/lib/themes'
import DisplayClient from '@/components/DisplayClient'

export default async function DisplayPage({ params }) {
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

  const activeQuestion = questions?.find((q) => q.is_active) || null

  let answersQuery = supabase
    .from('answers')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (activeQuestion) {
    answersQuery = answersQuery.eq('question_id', activeQuestion.id)
  } else {
    answersQuery = answersQuery.is('question_id', null)
  }

  const { data: initialAnswers } = await answersQuery

  const theme = getThemeConfig(session.theme)

  return (
    <DisplayClient
      session={session}
      activeQuestion={activeQuestion}
      initialAnswers={initialAnswers || []}
      theme={theme}
    />
  )
}
