import { getSession, getPermissions } from '@/lib/dal'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_req, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const perms = await getPermissions()

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) {
    return NextResponse.json({ error: 'Session tidak ditemukan.' }, { status: 404 })
  }

  if (!perms.includes('view_all_sessions') && session.user_id !== authSession.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const questions = await prisma.question.findMany({
    where: { session_id: id },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({ ...session, questions })
}

export async function PATCH(request, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const perms = await getPermissions()

  if (!perms.includes('manage_all_sessions')) {
    const existing = await prisma.session.findUnique({ where: { id } })
    if (!existing || existing.user_id !== authSession.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()

  const allowed = ['title', 'description', 'type', 'is_active', 'theme', 'shuffle_questions', 'shuffle_options', 'quiz_mode', 'detect_tab_switch', 'detect_window_blur', 'detect_devtools', 'detect_page_leave', 'detect_paste']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  )

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Tidak ada field yang valid.' }, { status: 400 })
  }

  const data = await prisma.session.update({ where: { id }, data: updates })
  return NextResponse.json(data)
}

export async function DELETE(_req, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const perms = await getPermissions()

  if (!perms.includes('manage_all_sessions')) {
    const existing = await prisma.session.findUnique({ where: { id } })
    if (!existing || existing.user_id !== authSession.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  await prisma.session.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
