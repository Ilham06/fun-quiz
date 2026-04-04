import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { session_id, question_id, student_name, content } = await request.json()

  if (!session_id || !content?.trim()) {
    return NextResponse.json(
      { error: 'session_id dan content wajib diisi.' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('id, is_active')
    .eq('id', session_id)
    .single()

  if (sessionError || !sessionData) {
    return NextResponse.json({ error: 'Session tidak ditemukan.' }, { status: 404 })
  }

  if (!sessionData.is_active) {
    return NextResponse.json({ error: 'Session tidak aktif.' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('answers')
    .insert({
      session_id,
      question_id: question_id || null,
      student_name: student_name?.trim() || null,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
