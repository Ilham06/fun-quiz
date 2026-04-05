import { createServerClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/dal'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  const authSession = await getSession()
  if (!authSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: session_id } = await params
  const { text, type, options, correct_answer, order, timer_seconds, show_answers } = await request.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Teks pertanyaan wajib diisi.' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('questions')
    .insert({
      session_id,
      text: text.trim(),
      type: type || 'open',
      options: options || null,
      correct_answer: correct_answer || null,
      timer_seconds: timer_seconds || 0,
      show_answers: show_answers !== false,
      order: order ?? 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
