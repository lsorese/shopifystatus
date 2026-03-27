import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const url = new URL(request.url)
  const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 365)
  const since = new Date(Date.now() - days * 86400000).toISOString()

  // Get all components
  const { data: components } = await getSupabaseAdmin()
    .from('components')
    .select('id, name, position')
    .order('position')

  // Calculate uptime per component from snapshots
  const uptimeByComponent = []

  for (const comp of components || []) {
    const { data: snapshots, count } = await getSupabaseAdmin()
      .from('component_snapshots')
      .select('status', { count: 'exact' })
      .eq('component_id', comp.id)
      .gte('polled_at', since)

    const total = count || 0
    const operational = (snapshots || []).filter(s => s.status === 'operational').length
    const uptime = total > 0 ? (operational / total * 100) : null

    // Count by status
    const statusCounts = {}
    for (const s of snapshots || []) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
    }

    uptimeByComponent.push({
      component: comp.name,
      component_id: comp.id,
      uptime_percent: uptime ? parseFloat(uptime.toFixed(4)) : null,
      total_checks: total,
      status_breakdown: statusCounts
    })
  }

  // Overall uptime (all components operational = system operational)
  const { data: allSnapshots } = await getSupabaseAdmin()
    .from('component_snapshots')
    .select('polled_at, status')
    .gte('polled_at', since)
    .order('polled_at')

  // Group snapshots by poll time
  const pollGroups = {}
  for (const s of allSnapshots || []) {
    if (!pollGroups[s.polled_at]) pollGroups[s.polled_at] = []
    pollGroups[s.polled_at].push(s.status)
  }

  const totalPolls = Object.keys(pollGroups).length
  const allOperational = Object.values(pollGroups).filter(
    statuses => statuses.every(s => s === 'operational')
  ).length
  const overallUptime = totalPolls > 0 ? parseFloat((allOperational / totalPolls * 100).toFixed(4)) : null

  // Incident stats for the period
  const { data: incidents } = await getSupabaseAdmin()
    .from('incidents')
    .select('id, impact, duration_minutes, created_at, resolved_at')
    .gte('created_at', since)

  const incidentStats = {
    total: incidents?.length || 0,
    by_impact: {},
    total_downtime_minutes: 0
  }

  for (const inc of incidents || []) {
    incidentStats.by_impact[inc.impact] = (incidentStats.by_impact[inc.impact] || 0) + 1
    if (inc.duration_minutes) incidentStats.total_downtime_minutes += inc.duration_minutes
  }

  return NextResponse.json({
    days,
    since,
    overall_uptime_percent: overallUptime,
    components: uptimeByComponent,
    incidents: incidentStats
  })
}
