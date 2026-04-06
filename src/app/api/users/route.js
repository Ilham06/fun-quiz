import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requirePermission, getSession } from '@/lib/dal'
import bcrypt from 'bcryptjs'

export async function GET() {
  await requirePermission('manage_users')

  const users = await prisma.user.findMany({
    include: { role: { select: { id: true, name: true, label: true } } },
    orderBy: { created_at: 'desc' },
  })

  const safe = users.map(({ password, ...u }) => u)
  return NextResponse.json(safe)
}

export async function POST(request) {
  await requirePermission('manage_users')

  const { username, password, name, role_id } = await request.json()

  if (!username?.trim() || !password || !name?.trim() || !role_id) {
    return NextResponse.json({ error: 'Semua field wajib diisi.' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { username: username.trim() } })
  if (exists) {
    return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { username: username.trim(), password: hash, name: name.trim(), role_id },
    include: { role: { select: { id: true, name: true, label: true } } },
  })

  const { password: _, ...safe } = user
  return NextResponse.json(safe, { status: 201 })
}
