import { getSupabaseAdmin } from './supabase-server'
import { fetchSummary, fetchIncidents } from './shopify-api'

export async function pollShopifyStatus() {
  const start = Date.now()
  const stats = { incidents_found: 0, incidents_updated: 0, incidents_new: 0, components_polled: 0, error: null }

  try {
    const [summary, incidentsData] = await Promise.all([
      fetchSummary(),
      fetchIncidents()
    ])

    // 1. Upsert components and store snapshots
    const components = summary.components || []
    stats.components_polled = components.length

    if (components.length > 0) {
      // Upsert components
      await getSupabaseAdmin().from('components').upsert(
        components.map(c => ({
          id: c.id,
          name: c.name,
          position: c.position
        })),
        { onConflict: 'id' }
      )

      // Store snapshots
      const now = new Date().toISOString()
      await getSupabaseAdmin().from('component_snapshots').insert(
        components.map(c => ({
          component_id: c.id,
          status: c.status,
          polled_at: now
        }))
      )
    }

    // 2. Upsert incidents
    const incidents = incidentsData.incidents || []
    stats.incidents_found = incidents.length

    for (const incident of incidents) {
      const durationMinutes = incident.resolved_at
        ? Math.round((new Date(incident.resolved_at) - new Date(incident.created_at)) / 60000)
        : null

      const affectedComponents = (incident.components || []).map(c => c.name)

      // Check if incident exists
      const { data: existing } = await getSupabaseAdmin()
        .from('incidents')
        .select('id, updated_at')
        .eq('id', incident.id)
        .single()

      if (!existing) {
        // New incident
        await getSupabaseAdmin().from('incidents').insert({
          id: incident.id,
          name: incident.name,
          status: incident.status,
          impact: incident.impact,
          shortlink: incident.shortlink,
          created_at: incident.created_at,
          updated_at: incident.updated_at,
          resolved_at: incident.resolved_at,
          started_at: incident.started_at || incident.created_at,
          duration_minutes: durationMinutes,
          affected_components: affectedComponents,
          first_seen: new Date().toISOString(),
          last_polled: new Date().toISOString()
        })
        stats.incidents_new++
      } else if (existing.updated_at !== incident.updated_at) {
        // Updated incident - preserve admin_notes
        await getSupabaseAdmin().from('incidents').update({
          name: incident.name,
          status: incident.status,
          impact: incident.impact,
          shortlink: incident.shortlink,
          updated_at: incident.updated_at,
          resolved_at: incident.resolved_at,
          started_at: incident.started_at || incident.created_at,
          duration_minutes: durationMinutes,
          affected_components: affectedComponents,
          last_polled: new Date().toISOString()
        }).eq('id', incident.id)
        stats.incidents_updated++
      } else {
        // Touch last_polled
        await getSupabaseAdmin().from('incidents').update({
          last_polled: new Date().toISOString()
        }).eq('id', incident.id)
      }

      // Upsert incident updates
      const updates = incident.incident_updates || []
      for (const update of updates) {
        await getSupabaseAdmin().from('incident_updates').upsert({
          id: update.id,
          incident_id: incident.id,
          status: update.status,
          body: update.body,
          display_at: update.display_at,
          affected_components: update.affected_components || []
        }, { onConflict: 'id' })
      }
    }

    // 3. Log the poll
    await getSupabaseAdmin().from('poll_log').insert({
      overall_status: summary.status?.indicator || 'unknown',
      incidents_found: stats.incidents_found,
      incidents_updated: stats.incidents_updated,
      incidents_new: stats.incidents_new,
      components_polled: stats.components_polled,
      duration_ms: Date.now() - start
    })

    return stats
  } catch (err) {
    stats.error = err.message
    await getSupabaseAdmin().from('poll_log').insert({
      overall_status: 'error',
      error: err.message,
      duration_ms: Date.now() - start
    }).catch(() => {}) // Don't throw on logging failure
    throw err
  }
}
