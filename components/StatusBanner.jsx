'use client'

const STATUS_LABELS = {
  operational: 'All Systems Operational',
  degraded_performance: 'Degraded Performance',
  partial_outage: 'Partial Outage',
  major_outage: 'Major Outage',
  under_maintenance: 'Under Maintenance'
}

export default function StatusBanner({ overall, lastChecked }) {
  const label = STATUS_LABELS[overall] || 'Unknown'

  return (
    <div className={`status-banner ${overall}`}>
      {label}
      {lastChecked && (
        <div className="last-checked">
          Last checked: {new Date(lastChecked).toLocaleString()}
        </div>
      )}
    </div>
  )
}
