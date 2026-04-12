import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const { session_id, emoji } = await request.json()

  if (!session_id || !emoji) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const data = await prisma.reaction.create({
    data: { session_id, emoji },
  })

  return NextResponse.json(data, { status: 201 })
}
