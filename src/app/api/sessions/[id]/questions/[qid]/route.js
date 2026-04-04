import { createServerClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/dal'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { qid } = await params
  const body = await request.json()
  const supabase = createServerClient()

  const allowed = ['text', 'type', 'options', 'order', 'is_active', 'timer_seconds', 'show_answers']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  )

  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', qid)
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

  const { qid } = await params
  const supabase = createServerClient()

  const { error } = await supabase.from('questions').delete().eq('id', qid)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
