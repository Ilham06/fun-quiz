import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_req, { params }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('answers')
    .select('upvotes')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('answers')
    .update({ upvotes: existing.upvotes + 1 })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
