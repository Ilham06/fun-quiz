import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/dal'
import bcrypt from 'bcryptjs'

export async function PATCH(request, { params }) {
  await requirePermission('manage_users')
  const { id } = await params
  const body = await request.json()

  const updates = {}
  if (body.name) updates.name = body.name.trim()
  if (body.role_id) updates.role_id = body.role_id
  if (body.password) updates.password = await bcrypt.hash(body.password, 12)

  const user = await prisma.user.update({
    where: { id },
    data: updates,
    include: { role: { select: { id: true, name: true, label: true } } },
  })

  const { password: _, ...safe } = user
  return NextResponse.json(safe)
}

export async function DELETE(_req, { params }) {
  await requirePermission('manage_users')
  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
