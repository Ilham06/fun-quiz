import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_req, { params }) {
  const { code } = await params

  const data = await prisma.session.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, code: true, title: true },
  })

  if (!data) {
    return NextResponse.json({ error: 'Session tidak ditemukan.' }, { status: 404 })
  }

  return NextResponse.json(data)
}
