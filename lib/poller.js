import { getSupabaseAdmin } from './supabase-server'
import { fetchSummary } from './shopify-api'

export async function pollShopifyStatus() {
  const start = Date.now()
  const stats = { components_polled: 0, error: null }

  try {
    const summary = await fetchSummary()

    // Upsert components and store snapshots
    const components = summary.components || []
    stats.components_polled = components.length

    if (components.length > 0) {
      await getSupabaseAdmin().from('components').upsert(
        components.map(c => ({
          id: c.id,
          name: c.name,
          position: c.position
        })),
        { onConflict: 'id' }
      )

      const now = new Date().toISOString()
      await getSupabaseAdmin().from('component_snapshots').insert(
        components.map(c => ({
          component_id: c.id,
          status: c.status,
          polled_at: now
        }))
      )
    }

    // Log the poll
    await getSupabaseAdmin().from('poll_log').insert({
      overall_status: summary.status?.indicator || 'unknown',
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
    }).catch(() => {})
    throw err
  }
}
