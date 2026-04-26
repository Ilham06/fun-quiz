import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request, { params }) {
  const { id: session_id } = await params
  const { student_name } = await request.json()

  if (!student_name?.trim()) {
    return NextResponse.json({ error: 'student_name wajib diisi.' }, { status: 400 })
  }

  const session = await prisma.session.findUnique({
    where: { id: session_id },
    select: { id: true, type: true },
  })

  if (!session) {
    return NextResponse.json({ error: 'Session tidak ditemukan.' }, { status: 404 })
  }

  if (session.type !== 'exam') {
    return NextResponse.json({ error: 'Scoring hanya untuk tipe exam.' }, { status: 400 })
  }

  const questions = await prisma.question.findMany({
    where: { session_id },
    select: { id: true, text: true, correct_answer: true, type: true, options: true },
    orderBy: { order: 'asc' },
  })

  const answers = await prisma.answer.findMany({
    where: { session_id, student_name: student_name.trim() },
    select: { question_id: true, content: true },
  })

  const answerMap = {}
  for (const a of answers) {
    if (a.question_id) answerMap[a.question_id] = a.content
  }

  const scorableQuestions = questions.filter(q => q.correct_answer)
  let correctCount = 0
  const details = questions.map((q, i) => {
    const myAnswer = answerMap[q.id] || null
    const hasCorrect = !!q.correct_answer
    const isCorrect = hasCorrect && myAnswer === q.correct_answer

    if (isCorrect) correctCount++

    return {
      index: i + 1,
      text: q.text,
      myAnswer,
      isCorrect: hasCorrect ? isCorrect : null,
      correctAnswer: hasCorrect && !isCorrect ? q.correct_answer : null,
    }
  })

  const totalScorable = scorableQuestions.length
  const scorePercent = totalScorable > 0 ? Math.round((correctCount / totalScorable) * 100) : 0

  return NextResponse.json({
    hasAnswers: answers.length > 0,
    correctCount,
    totalScorable,
    scorePercent,
    totalQuestions: questions.length,
    answeredCount: answers.length,
    details,
  })
}
