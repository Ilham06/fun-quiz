import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(_req, { params }) {
  const { id } = await params

  const existing = await prisma.answer.findUnique({
    where: { id },
    select: { upvotes: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
  }

  const data = await prisma.answer.update({
    where: { id },
    data: { upvotes: { increment: 1 } },
  })

  return NextResponse.json(data)
}
