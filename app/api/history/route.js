import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Returns component status over time for charting
export async function GET(request) {
  const url = new URL(request.url)
  const hours = Math.min(parseInt(url.searchParams.get('hours') || '24'), 168) // max 7 days
  const since = new Date(Date.now() - hours * 3600000).toISOString()

  const { data: snapshots } = await getSupabaseAdmin()
    .from('component_snapshots')
    .select('component_id, status, polled_at')
    .gte('polled_at', since)
    .order('polled_at', { ascending: true })

  const { data: components } = await getSupabaseAdmin()
    .from('components')
    .select('id, name, position')
    .order('position')

  // Build a timeline: group by polled_at, show overall status per time point
  const timeline = []
  const grouped = {}

  for (const s of snapshots || []) {
    if (!grouped[s.polled_at]) grouped[s.polled_at] = {}
    grouped[s.polled_at][s.component_id] = s.status
  }

  const statusWeight = {
    operational: 0,
    under_maintenance: 1,
    degraded_performance: 2,
    partial_outage: 3,
    major_outage: 4
  }

  for (const [time, statuses] of Object.entries(grouped)) {
    const worstStatus = Object.values(statuses).reduce((worst, s) => {
      return (statusWeight[s] || 0) > (statusWeight[worst] || 0) ? s : worst
    }, 'operational')

    const nonOperational = Object.entries(statuses)
      .filter(([, s]) => s !== 'operational')
      .map(([compId, s]) => {
        const comp = (components || []).find(c => c.id === compId)
        return { component: comp?.name || compId, status: s }
      })

    timeline.push({
      time,
      overall: worstStatus,
      issues: nonOperational
    })
  }

  // Per-component timeline for detailed charts
  const componentTimelines = {}
  for (const comp of components || []) {
    componentTimelines[comp.name] = (snapshots || [])
      .filter(s => s.component_id === comp.id)
      .map(s => ({ time: s.polled_at, status: s.status }))
  }

  return NextResponse.json({
    hours,
    since,
    timeline,
    components: componentTimelines
  })
}
