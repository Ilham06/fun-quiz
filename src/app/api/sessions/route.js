import { createServerClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/dal'
import { NextResponse } from 'next/server'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, type } = await request.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 })
  }

  const supabase = createServerClient()

  let code
  let attempts = 0
  while (attempts < 10) {
    code = generateCode()
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('code', code)
      .single()
    if (!existing) break
    attempts++
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({ title: title.trim(), description, type: type || 'quiz', code })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
