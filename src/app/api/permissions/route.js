import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/dal'

export async function GET() {
  await requirePermission('manage_roles')
  const permissions = await prisma.permission.findMany({ orderBy: { group: 'asc' } })
  return NextResponse.json(permissions)
}
