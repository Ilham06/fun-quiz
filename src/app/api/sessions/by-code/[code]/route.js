import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req, { params }) {
  const { code } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('id, code, title')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Session tidak ditemukan.' }, { status: 404 })
  }

  return NextResponse.json(data)
}
