'use client'

import { useState, useEffect } from 'react'

const STATUS_CLASS = {
  none: 'operational',
  minor: 'degraded_performance',
  major: 'major_outage',
  critical: 'major_outage',
  error: 'major_outage'
}

export default function PollTable() {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/polls?limit=25')
      .then(r => r.json())
      .then(data => { setPolls(data.polls || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (polls.length === 0) return <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No polls recorded yet.</div>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Status</th>
            <th>New</th>
            <th>Updated</th>
            <th>Found</th>
            <th>Components</th>
            <th>Duration</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {polls.map(poll => (
            <tr key={poll.id}>
              <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                {new Date(poll.polled_at).toLocaleString()}
              </td>
              <td>
                <span className={`status-${STATUS_CLASS[poll.overall_status] || poll.overall_status}`} style={{ fontSize: 12, fontWeight: 600 }}>
                  {poll.overall_status === 'none' ? 'operational' : poll.overall_status}
                </span>
              </td>
              <td style={{ color: poll.incidents_new > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                {poll.incidents_new || 0}
              </td>
              <td style={{ color: poll.incidents_updated > 0 ? 'var(--yellow)' : 'var(--text-muted)' }}>
                {poll.incidents_updated || 0}
              </td>
              <td>{poll.incidents_found || 0}</td>
              <td>{poll.components_polled || 0}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {poll.duration_ms ? `${poll.duration_ms}ms` : '—'}
              </td>
              <td style={{ color: 'var(--red)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {poll.error || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
