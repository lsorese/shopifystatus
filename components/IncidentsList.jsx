'use client'

import { useState, useEffect } from 'react'
import IncidentCard from './IncidentCard'

export default function IncidentsList() {
  const [incidents, setIncidents] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ impact: '', component: '' })
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit, offset })
    if (filter.impact) params.set('impact', filter.impact)
    if (filter.component) params.set('component', filter.component)

    fetch(`/api/incidents?${params}`)
      .then(r => r.json())
      .then(data => {
        setIncidents(data.incidents || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filter, offset])

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select
          value={filter.impact}
          onChange={e => { setFilter(f => ({ ...f, impact: e.target.value })); setOffset(0) }}
          style={{
            padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)', fontSize: 13
          }}
        >
          <option value="">All impacts</option>
          <option value="critical">Critical</option>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
          <option value="none">None</option>
        </select>

        <select
          value={filter.component}
          onChange={e => { setFilter(f => ({ ...f, component: e.target.value })); setOffset(0) }}
          style={{
            padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)', fontSize: 13
          }}
        >
          <option value="">All components</option>
          <option value="Admin">Admin</option>
          <option value="Checkout">Checkout</option>
          <option value="Storefront">Storefront</option>
          <option value="API & Mobile">API & Mobile</option>
          <option value="Point of Sale">Point of Sale</option>
          <option value="Reports and Dashboards">Reports and Dashboards</option>
          <option value="Third party services">Third party services</option>
          <option value="Support">Support</option>
          <option value="Oxygen">Oxygen</option>
        </select>

        <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>
          {total} incident{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><div>Loading...</div></div>
      ) : incidents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          No incidents found.
        </div>
      ) : (
        <>
          {incidents.map(inc => (
            <IncidentCard key={inc.id} incident={inc} showUpdates={true} />
          ))}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
            {offset > 0 && (
              <button className="btn" onClick={() => setOffset(o => Math.max(0, o - limit))}>
                Previous
              </button>
            )}
            {offset + limit < total && (
              <button className="btn" onClick={() => setOffset(o => o + limit)}>
                Next
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
