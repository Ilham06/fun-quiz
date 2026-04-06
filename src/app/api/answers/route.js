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
    select: { id: true, is_active: true },
  })

  if (!sessionData) {
    return NextResponse.json({ error: 'Session tidak ditemukan.' }, { status: 404 })
  }

  if (!sessionData.is_active) {
    return NextResponse.json({ error: 'Session tidak aktif.' }, { status: 403 })
  }

  const data = await prisma.answer.create({
    data: {
      session_id,
      question_id: question_id || null,
      student_name: student_name?.trim() || null,
      content: content.trim(),
    },
  })

  return NextResponse.json(data, { status: 201 })
}
