import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/dal'

export async function PATCH(request, { params }) {
  await requirePermission('manage_roles')
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.role.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Role tidak ditemukan.' }, { status: 404 })
  }

  const updates = {}
  if (body.label) updates.label = body.label.trim()

  if (body.permission_ids) {
    await prisma.rolePermission.deleteMany({ where: { role_id: id } })
    await prisma.rolePermission.createMany({
      data: body.permission_ids.map((pid) => ({ role_id: id, permission_id: pid })),
    })
  }

  const role = await prisma.role.update({
    where: { id },
    data: updates,
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  })

  return NextResponse.json(role)
}

export async function DELETE(_req, { params }) {
  await requirePermission('manage_roles')
  const { id } = await params

  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } })
  if (!role) {
    return NextResponse.json({ error: 'Role tidak ditemukan.' }, { status: 404 })
  }
  if (role.is_system) {
    return NextResponse.json({ error: 'Role sistem tidak bisa dihapus.' }, { status: 403 })
  }
  if (role._count.users > 0) {
    return NextResponse.json({ error: 'Role masih dipakai oleh user.' }, { status: 409 })
  }

  await prisma.role.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
