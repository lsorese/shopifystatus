import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const impact = url.searchParams.get('impact') // minor, major, critical
  const component = url.searchParams.get('component') // component name filter
  const status = url.searchParams.get('status') // resolved, investigating, etc.

  let query = getSupabaseAdmin()
    .from('incidents')
    .select('*, incident_updates(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (impact) query = query.eq('impact', impact)
  if (status) query = query.eq('status', status)
  if (component) query = query.contains('affected_components', [component])

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sort updates within each incident
  const incidents = (data || []).map(inc => ({
    ...inc,
    incident_updates: (inc.incident_updates || []).sort(
      (a, b) => new Date(b.display_at) - new Date(a.display_at)
    )
  }))

  return NextResponse.json({ incidents, total: count })
}
