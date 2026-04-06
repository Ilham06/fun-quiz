import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/dal'

export async function GET() {
  await requirePermission('manage_roles')

  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
    orderBy: { created_at: 'asc' },
  })

  return NextResponse.json(roles)
}

export async function POST(request) {
  await requirePermission('manage_roles')

  const { name, label, permission_ids } = await request.json()

  if (!name?.trim() || !label?.trim()) {
    return NextResponse.json({ error: 'Nama dan label wajib diisi.' }, { status: 400 })
  }

  const role = await prisma.role.create({
    data: {
      name: name.trim().toUpperCase(),
      label: label.trim(),
      permissions: {
        create: (permission_ids || []).map((pid) => ({ permission_id: pid })),
      },
    },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  })

  return NextResponse.json(role, { status: 201 })
}
