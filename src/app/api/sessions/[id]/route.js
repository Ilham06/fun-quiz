import { createServerClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/dal'
import { NextResponse } from 'next/server'

export async function GET(_req, { params }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session tidak ditemukan.' }, { status: 404 })
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', id)
    .order('order', { ascending: true })

  return NextResponse.json({ ...session, questions: questions || [] })
}

export async function PATCH(request, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const supabase = createServerClient()

  const allowed = ['title', 'description', 'type', 'is_active']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  )

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Tidak ada field yang valid.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase.from('sessions').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
