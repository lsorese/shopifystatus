import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Update admin_notes on an incident
export async function PATCH(request) {
  const { error } = await verifyAdmin(request)
  if (error) return NextResponse.json({ error }, { status: 401 })

  const { id, admin_notes } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing incident id' }, { status: 400 })

  const { data, error: dbError } = await getSupabaseAdmin()
    .from('incidents')
    .update({ admin_notes })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
