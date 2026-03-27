'use client'

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDuration(minutes) {
  if (!minutes) return null
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function IncidentCard({ incident, showUpdates = true }) {
  const updates = incident.incident_updates || []

  return (
    <div className="incident-card">
      <div className="incident-header">
        <span className="incident-name">{incident.name}</span>
        <span className={`impact-badge impact-${incident.impact}`}>{incident.impact}</span>
      </div>

      <div className="incident-meta">
        <span>{new Date(incident.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span>{timeAgo(incident.created_at)}</span>
        {incident.duration_minutes && <span>Duration: {formatDuration(incident.duration_minutes)}</span>}
        <span style={{ textTransform: 'capitalize' }}>{incident.status}</span>
      </div>

      {incident.affected_components?.length > 0 && (
        <div className="incident-components">
          {incident.affected_components.map(c => (
            <span key={c} className="component-tag">{c}</span>
          ))}
        </div>
      )}

      {showUpdates && updates.length > 0 && (
        <div className="incident-updates">
          {updates.map(update => (
            <div key={update.id} className="incident-update">
              <div>
                <span className={`update-status status-${update.status === 'resolved' ? 'operational' : 'major_outage'}`}>
                  {update.status}
                </span>
                <span className="update-time">
                  {new Date(update.display_at).toLocaleString()}
                </span>
              </div>
              {update.body && <div className="update-body">{update.body}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
