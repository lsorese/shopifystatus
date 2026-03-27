'use client'

function formatStatus(status) {
  return status.replace(/_/g, ' ')
}

export default function ComponentList({ components }) {
  if (!components?.length) return null

  return (
    <div className="component-list">
      {components.map(comp => (
        <div key={comp.id} className="component-row">
          <span className="component-name">{comp.name}</span>
          <span className={`component-status status-${comp.status}`}>
            <span className={`status-dot ${comp.status}`} />
            {formatStatus(comp.status)}
          </span>
        </div>
      ))}
    </div>
  )
}
