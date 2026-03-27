import IncidentsList from '@/components/IncidentsList'

export const metadata = {
  title: 'Incident History — Shopify Status Tracker',
  description: 'Full history of Shopify incidents, outages, and degraded performance.',
}

export default function IncidentsPage() {
  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <div className="section-header" style={{ marginBottom: 24 }}>
        <h2>Incident History</h2>
      </div>
      <IncidentsList />
    </div>
  )
}
