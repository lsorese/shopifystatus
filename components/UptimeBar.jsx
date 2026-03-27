'use client'

function getColor(pct) {
  if (pct === null) return 'var(--text-dim)'
  if (pct >= 99.9) return 'var(--green)'
  if (pct >= 99) return 'var(--yellow)'
  if (pct >= 95) return 'var(--orange)'
  return 'var(--red)'
}

export default function UptimeBar({ label, percent }) {
  const display = percent !== null ? `${percent.toFixed(2)}%` : 'No data'
  const color = getColor(percent)

  return (
    <div className="uptime-bar-container">
      <div className="uptime-label">
        <span>{label}</span>
        <span style={{ color }}>{display}</span>
      </div>
      <div className="uptime-bar">
        <div
          className="uptime-fill"
          style={{
            width: percent !== null ? `${Math.max(percent, 1)}%` : '0%',
            background: color
          }}
        />
      </div>
    </div>
  )
}
