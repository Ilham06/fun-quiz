import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const { session_id, question_id, student_name, type, left_at, returned_at, duration_seconds } = await request.json()

  if (!session_id || !left_at) {
    return NextResponse.json(
      { error: 'session_id dan left_at wajib diisi.' },
      { status: 400 }
    )
  }

  const validTypes = ['tab_hidden', 'window_blur', 'devtools_open', 'page_leave', 'external_paste']
  const violationType = validTypes.includes(type) ? type : 'tab_hidden'

  const data = await prisma.tabViolation.create({
    data: {
      session_id,
      question_id: question_id || null,
      student_name: student_name?.trim() || null,
      type: violationType,
      left_at: new Date(left_at),
      returned_at: returned_at ? new Date(returned_at) : null,
      duration_seconds: duration_seconds || null,
    },
  })

  return NextResponse.json(data, { status: 201 })
}
