'use client'

import { useState, useEffect } from 'react'
import StatusBanner from './StatusBanner'
import ComponentList from './ComponentList'
import UptimeBar from './UptimeBar'
import StatusChart from './StatusChart'
import PollTable from './PollTable'

export default function Dashboard() {
  const [status, setStatus] = useState(null)
  const [uptime, setUptime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartHours, setChartHours] = useState(24)

  useEffect(() => {
    Promise.all([
      fetch('/api/status').then(r => r.json()),
      fetch('/api/uptime?days=30').then(r => r.json())
    ]).then(([statusData, uptimeData]) => {
      setStatus(statusData)
      setUptime(uptimeData)
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

  return (
    <>
      <StatusBanner overall={status.overall} lastChecked={status.last_checked} />

      <ComponentList components={status.components} />

      {/* Status Timeline Chart */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-header">
          <h2>Status Timeline</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {[6, 24, 48, 168].map(h => (
              <button
                key={h}
                className={`btn btn-sm ${chartHours === h ? 'btn-primary' : ''}`}
                onClick={() => setChartHours(h)}
              >
                {h <= 48 ? `${h}h` : '7d'}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <StatusChart hours={chartHours} />
        </div>
      </div>

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
              <div className="stat-value">{uptime.total_non_operational_checks || 0}</div>
              <div className="stat-label">Non-Operational Checks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{uptime.total_checks || 0}</div>
              <div className="stat-label">Total Checks</div>
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

      {/* Recent Polls Table */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-header">
          <h2>Recent Polls</h2>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <PollTable />
        </div>
      </div>
    </>
  )
}
