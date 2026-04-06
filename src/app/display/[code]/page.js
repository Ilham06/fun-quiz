import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getThemeConfig } from '@/lib/themes'
import DisplayClient from '@/components/DisplayClient'

export default async function DisplayPage({ params }) {
  const { code } = await params

  const session = await prisma.session.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!session) notFound()

  const questions = await prisma.question.findMany({
    where: { session_id: session.id },
    orderBy: { order: 'asc' },
  })

  const activeQuestion = questions?.find((q) => q.is_active) || null

  const answersWhere = { session_id: session.id }
  if (activeQuestion) {
    answersWhere.question_id = activeQuestion.id
  } else {
    answersWhere.question_id = null
  }

  const initialAnswers = await prisma.answer.findMany({
    where: answersWhere,
    orderBy: { created_at: 'desc' },
    take: 100,
  })

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
