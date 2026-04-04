import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { session_id, question_id, student_name, left_at, returned_at, duration_seconds } = await request.json()

  if (!session_id || !left_at) {
    return NextResponse.json(
      { error: 'session_id dan left_at wajib diisi.' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('tab_violations')
    .insert({
      session_id,
      question_id: question_id || null,
      student_name: student_name?.trim() || null,
      left_at,
      returned_at: returned_at || null,
      duration_seconds: duration_seconds || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
