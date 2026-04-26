import { getSession, getPermissions } from '@/lib/dal'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: session_id } = await params

  const perms = await getPermissions()
  if (!perms.includes('manage_all_sessions')) {
    const session = await prisma.session.findUnique({ where: { id: session_id }, select: { user_id: true } })
    if (!session || session.user_id !== authSession.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { text, type, options, correct_answer, order, timer_seconds, show_answers } = await request.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Teks pertanyaan wajib diisi.' }, { status: 400 })
  }

  const data = await prisma.question.create({
    data: {
      session_id,
      text: text.trim(),
      type: type || 'open',
      options: options || undefined,
      correct_answer: correct_answer || null,
      timer_seconds: timer_seconds || 0,
      show_answers: show_answers !== false,
      order: order ?? 0,
    },
  })

  return NextResponse.json(data, { status: 201 })
}
