import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Get latest snapshot per component
  const { data: components } = await getSupabaseAdmin()
    .from('components')
    .select('id, name, position')
    .order('position')

  const componentStatuses = []
  for (const comp of components || []) {
    const { data: latest } = await getSupabaseAdmin()
      .from('component_snapshots')
      .select('status, polled_at')
      .eq('component_id', comp.id)
      .order('polled_at', { ascending: false })
      .limit(1)
      .single()

    componentStatuses.push({
      ...comp,
      status: latest?.status || 'unknown',
      last_checked: latest?.polled_at || null
    })
  }

  // Get active incidents
  const { data: activeIncidents } = await getSupabaseAdmin()
    .from('incidents')
    .select('*, incident_updates(*)')
    .neq('status', 'resolved')
    .neq('status', 'postmortem')
    .order('created_at', { ascending: false })

  // Overall status
  const hasOutage = componentStatuses.some(c => c.status === 'major_outage')
  const hasPartial = componentStatuses.some(c => c.status === 'partial_outage')
  const hasDegraded = componentStatuses.some(c => c.status === 'degraded_performance')
  const hasMaintenance = componentStatuses.some(c => c.status === 'under_maintenance')

  let overall = 'operational'
  if (hasOutage) overall = 'major_outage'
  else if (hasPartial) overall = 'partial_outage'
  else if (hasDegraded) overall = 'degraded_performance'
  else if (hasMaintenance) overall = 'under_maintenance'

  // Last poll time
  const { data: lastPoll } = await getSupabaseAdmin()
    .from('poll_log')
    .select('polled_at')
    .order('polled_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    overall,
    components: componentStatuses,
    active_incidents: activeIncidents || [],
    last_checked: lastPoll?.polled_at || null
  })
}
