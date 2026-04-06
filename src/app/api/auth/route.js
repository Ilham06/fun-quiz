import { createSession, deleteSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const { username, password } = await request.json()

  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: true },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json(
      { error: 'Username atau password salah.' },
      { status: 401 }
    )
  }

  await createSession(user.id, user.role_id)
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await deleteSession()
  return NextResponse.json({ ok: true })
}
