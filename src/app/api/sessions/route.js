import { getSession, getPermissions } from '@/lib/dal'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const perms = await getPermissions()
  const where = perms.includes('view_all_sessions') ? {} : { user_id: session.userId }

  const data = await prisma.session.findMany({
    where,
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(data)
}

export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, type, theme } = await request.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 })
  }

  let code
  let attempts = 0
  while (attempts < 10) {
    code = generateCode()
    const existing = await prisma.session.findUnique({ where: { code } })
    if (!existing) break
    attempts++
  }

  const data = await prisma.session.create({
    data: {
      title: title.trim(),
      description: description || null,
      type: type || 'quiz',
      theme: theme || 'default',
      code,
      user_id: session.userId,
    },
  })

  return NextResponse.json(data, { status: 201 })
}
