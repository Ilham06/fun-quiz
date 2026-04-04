import { createSession, deleteSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { username, password } = await request.json()

  if (
    username !== process.env.TEACHER_USERNAME ||
    password !== process.env.TEACHER_PASSWORD
  ) {
    return NextResponse.json(
      { error: 'Username atau password salah.' },
      { status: 401 }
    )
  }

  await createSession('teacher')
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await deleteSession()
  return NextResponse.json({ ok: true })
}
