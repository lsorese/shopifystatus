'use client'

import { useState, useEffect } from 'react'
import StatusBanner from './StatusBanner'
import ComponentList from './ComponentList'
import IncidentCard from './IncidentCard'
import UptimeBar from './UptimeBar'

export default function Dashboard() {
  const [status, setStatus] = useState(null)
  const [uptime, setUptime] = useState(null)
  const [incidents, setIncidents] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/status').then(r => r.json()),
      fetch('/api/uptime?days=30').then(r => r.json()),
      fetch('/api/incidents?limit=10').then(r => r.json())
    ]).then(([statusData, uptimeData, incidentsData]) => {
      setStatus(statusData)
      setUptime(uptimeData)
      setIncidents(incidentsData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <div>Loading status...</div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="loading">
        <div>Unable to load status data. Make sure Supabase is configured and the poller has run at least once.</div>
      </div>
    )
  }

  const recentIncidents = incidents?.incidents || []

  return (
    <>
      <StatusBanner overall={status.overall} lastChecked={status.last_checked} />

      <ComponentList components={status.components} />

      {uptime && (
        <div className="uptime-section">
          <div className="section-header">
            <h2>30-Day Uptime</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ color: uptime.overall_uptime_percent >= 99.9 ? 'var(--green)' : 'var(--orange)' }}>
                {uptime.overall_uptime_percent !== null ? `${uptime.overall_uptime_percent.toFixed(2)}%` : 'N/A'}
              </div>
              <div className="stat-label">Overall Uptime</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{uptime.incidents?.total || 0}</div>
              <div className="stat-label">Incidents (30d)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: uptime.incidents?.total_downtime_minutes > 0 ? 'var(--red)' : 'var(--green)' }}>
                {uptime.incidents?.total_downtime_minutes
                  ? `${Math.round(uptime.incidents.total_downtime_minutes / 60)}h ${uptime.incidents.total_downtime_minutes % 60}m`
                  : '0m'}
              </div>
              <div className="stat-label">Total Downtime</div>
            </div>
          </div>

          {uptime.components?.map(comp => (
            <UptimeBar
              key={comp.component_id}
              label={comp.component}
              percent={comp.uptime_percent}
            />
          ))}
        </div>
      )}

      <div className="section-header">
        <h2>Recent Incidents</h2>
        <a href="/incidents">View all</a>
      </div>

      {recentIncidents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          No incidents recorded yet. The poller will start collecting data on its next run.
        </div>
      ) : (
        recentIncidents.map(inc => (
          <IncidentCard key={inc.id} incident={inc} showUpdates={false} />
        ))
      )}
    </>
  )
}
