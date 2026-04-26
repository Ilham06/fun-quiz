import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const { session_id, question_id, student_name, content } = await request.json()

  if (!session_id || !content?.trim()) {
    return NextResponse.json(
      { error: 'session_id dan content wajib diisi.' },
      { status: 400 }
    )
  }

  const sessionData = await prisma.session.findUnique({
    where: { id: session_id },
    select: { id: true, is_active: true, type: true },
  })

  if (!sessionData) {
    return NextResponse.json({ error: 'Session tidak ditemukan.' }, { status: 404 })
  }

  if (!sessionData.is_active) {
    return NextResponse.json({ error: 'Session tidak aktif.' }, { status: 403 })
  }

  if (question_id) {
    const question = await prisma.question.findUnique({
      where: { id: question_id },
      select: { id: true, session_id: true },
    })
    if (!question || question.session_id !== session_id) {
      return NextResponse.json({ error: 'Soal tidak valid untuk session ini.' }, { status: 400 })
    }
  }

  const trimmedName = student_name?.trim() || null
  const trimmedContent = content.trim()

  if (sessionData.type === 'exam' && question_id && trimmedName) {
    const existing = await prisma.answer.findFirst({
      where: { session_id, question_id, student_name: trimmedName },
    })
    if (existing) {
      return NextResponse.json({ error: 'Kamu sudah menjawab soal ini.' }, { status: 409 })
    }
  }

  const data = await prisma.answer.create({
    data: {
      session_id,
      question_id: question_id || null,
      student_name: trimmedName,
      content: trimmedContent,
    },
  })

  return NextResponse.json(data, { status: 201 })
}
