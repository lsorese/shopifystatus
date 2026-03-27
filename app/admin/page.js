'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  if (typeof window === 'undefined') return null
  if (!window.__supabase) {
    window.__supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return window.__supabase
}

export default function AdminPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('incidents')

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  if (!session) return <LoginForm />

  return (
    <div className="admin-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Admin Dashboard</h2>
        <button className="btn btn-sm" onClick={() => getSupabase().auth.signOut()}>Sign Out</button>
      </div>

      <div className="admin-tabs">
        {['incidents', 'polling', 'logs'].map(t => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'incidents' && <IncidentsTab token={session.access_token} />}
      {tab === 'polling' && <PollingTab token={session.access_token} />}
      {tab === 'logs' && <LogsTab />}
    </div>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <form className="login-form" onSubmit={handleLogin}>
      <h2>Admin Login</h2>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      {error && <div className="error-text">{error}</div>}
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

function IncidentsTab({ token }) {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    fetch('/api/incidents?limit=50')
      .then(r => r.json())
      .then(data => { setIncidents(data.incidents || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function saveNote(id) {
    await fetch('/api/admin/incidents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, admin_notes: noteText })
    })
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, admin_notes: noteText } : inc))
    setEditingId(null)
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Incidents ({incidents.length})</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Impact</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Components</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {incidents.map(inc => (
            <tr key={inc.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{new Date(inc.created_at).toLocaleDateString()}</td>
              <td>{inc.name}</td>
              <td><span className={`impact-badge impact-${inc.impact}`}>{inc.impact}</span></td>
              <td style={{ textTransform: 'capitalize' }}>{inc.status}</td>
              <td>{inc.duration_minutes ? `${inc.duration_minutes}m` : '—'}</td>
              <td>{(inc.affected_components || []).join(', ')}</td>
              <td>
                {editingId === inc.id ? (
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={2}
                    style={{ width: 200, padding: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontSize: 12 }}
                  />
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inc.admin_notes || '—'}</span>
                )}
              </td>
              <td>
                {editingId === inc.id ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-sm btn-primary" onClick={() => saveNote(inc.id)}>Save</button>
                    <button className="btn btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-sm" onClick={() => { setEditingId(inc.id); setNoteText(inc.admin_notes || '') }}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PollingTab({ token }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function triggerPoll() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/poll', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Manual Poll</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
        Trigger an immediate poll of Shopify&apos;s status page. This runs the same logic as the cron job.
      </p>
      <button className="btn btn-primary" onClick={triggerPoll} disabled={loading}>
        {loading ? 'Polling...' : 'Poll Now'}
      </button>

      {result && (
        <pre style={{
          marginTop: 16, padding: 16, background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 8, fontSize: 13, overflow: 'auto', color: result.error ? 'var(--red)' : 'var(--green)'
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

function LogsTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    sb.from('poll_log')
      .select('*')
      .order('polled_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Poll Logs (Last 50)</h3>
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
          {logs.map(log => (
            <tr key={log.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.polled_at).toLocaleString()}</td>
              <td><span className={`status-${log.overall_status === 'none' ? 'operational' : log.overall_status}`}>{log.overall_status}</span></td>
              <td>{log.incidents_new}</td>
              <td>{log.incidents_updated}</td>
              <td>{log.incidents_found}</td>
              <td>{log.components_polled}</td>
              <td>{log.duration_ms}ms</td>
              <td style={{ color: 'var(--red)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.error || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
