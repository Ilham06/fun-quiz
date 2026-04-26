import { getSession, getPermissions } from '@/lib/dal'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

async function verifyQuestionOwnership(authSession, sessionId) {
  const perms = await getPermissions()
  if (perms.includes('manage_all_sessions')) return true
  const session = await prisma.session.findUnique({ where: { id: sessionId }, select: { user_id: true } })
  return session && session.user_id === authSession.userId
}

export async function PATCH(request, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, qid } = await params

  if (!(await verifyQuestionOwnership(authSession, id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const question = await prisma.question.findUnique({ where: { id: qid }, select: { session_id: true } })
  if (!question || question.session_id !== id) {
    return NextResponse.json({ error: 'Soal tidak ditemukan.' }, { status: 404 })
  }

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

  const { id, qid } = await params

  if (!(await verifyQuestionOwnership(authSession, id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const question = await prisma.question.findUnique({ where: { id: qid }, select: { session_id: true } })
  if (!question || question.session_id !== id) {
    return NextResponse.json({ error: 'Soal tidak ditemukan.' }, { status: 404 })
  }

  await prisma.question.delete({ where: { id: qid } })
  return NextResponse.json({ ok: true })
}
