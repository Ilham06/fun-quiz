import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const { session_id, question_id, student_name, left_at, returned_at, duration_seconds } = await request.json()

  if (!session_id || !left_at) {
    return NextResponse.json(
      { error: 'session_id dan left_at wajib diisi.' },
      { status: 400 }
    )
  }

  const data = await prisma.tabViolation.create({
    data: {
      session_id,
      question_id: question_id || null,
      student_name: student_name?.trim() || null,
      left_at: new Date(left_at),
      returned_at: returned_at ? new Date(returned_at) : null,
      duration_seconds: duration_seconds || null,
    },
  })

  return NextResponse.json(data, { status: 201 })
}
