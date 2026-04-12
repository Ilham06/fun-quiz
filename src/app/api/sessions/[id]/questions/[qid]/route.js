import { getSession } from '@/lib/dal'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(request, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { qid } = await params
  const body = await request.json()

  const allowed = ['text', 'type', 'options', 'correct_answer', 'order', 'is_active', 'timer_seconds', 'show_answers']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  )

  const data = await prisma.question.update({
    where: { id: qid },
    data: updates,
  })

  return NextResponse.json(data)
}

export async function DELETE(_req, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { qid } = await params
  await prisma.question.delete({ where: { id: qid } })
  return NextResponse.json({ ok: true })
}
