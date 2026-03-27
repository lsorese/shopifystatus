-- Shopify Status Tracker Schema
-- Run this in your Supabase SQL editor

-- Components reference table
CREATE TABLE components (
  id TEXT PRIMARY KEY,                    -- Statuspage component ID (e.g. 'j2v844ncbwhc')
  name TEXT NOT NULL,                     -- e.g. 'Checkout', 'Admin'
  position INTEGER,                       -- Display order
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Component status snapshots (every 5 min)
CREATE TABLE component_snapshots (
  id BIGSERIAL PRIMARY KEY,
  component_id TEXT NOT NULL REFERENCES components(id),
  status TEXT NOT NULL,                   -- operational, degraded_performance, partial_outage, major_outage, under_maintenance
  polled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_component_polled ON component_snapshots(component_id, polled_at DESC);
CREATE INDEX idx_snapshots_polled ON component_snapshots(polled_at DESC);
CREATE INDEX idx_snapshots_status ON component_snapshots(status) WHERE status != 'operational';

-- Incidents
CREATE TABLE incidents (
  id TEXT PRIMARY KEY,                    -- Statuspage incident ID
  name TEXT NOT NULL,
  status TEXT NOT NULL,                   -- investigating, identified, monitoring, resolved, postmortem
  impact TEXT NOT NULL,                   -- none, minor, major, critical
  shortlink TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,                -- When it actually started (from first update)
  duration_minutes INTEGER,              -- Calculated: resolved_at - created_at
  affected_components TEXT[],            -- Array of component names
  admin_notes TEXT,                       -- Manual notes from admin
  first_seen TIMESTAMPTZ DEFAULT NOW(),  -- When our poller first noticed it
  last_polled TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_impact ON incidents(impact);

-- Incident updates (each status change within an incident)
CREATE TABLE incident_updates (
  id TEXT PRIMARY KEY,                    -- Statuspage update ID
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  body TEXT,
  display_at TIMESTAMPTZ NOT NULL,
  affected_components JSONB,             -- [{code, name, old_status, new_status}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_updates_incident ON incident_updates(incident_id, display_at DESC);

-- Poll log for debugging
CREATE TABLE poll_log (
  id BIGSERIAL PRIMARY KEY,
  polled_at TIMESTAMPTZ DEFAULT NOW(),
  overall_status TEXT,                    -- none, minor, major, critical
  incidents_found INTEGER DEFAULT 0,
  incidents_updated INTEGER DEFAULT 0,
  incidents_new INTEGER DEFAULT 0,
  components_polled INTEGER DEFAULT 0,
  error TEXT,
  duration_ms INTEGER
);

CREATE INDEX idx_poll_log_polled ON poll_log(polled_at DESC);

-- Enable Row Level Security
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_log ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read" ON components FOR SELECT USING (true);
CREATE POLICY "Public read" ON component_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read" ON incidents FOR SELECT USING (true);
CREATE POLICY "Public read" ON incident_updates FOR SELECT USING (true);
CREATE POLICY "Public read" ON poll_log FOR SELECT USING (true);

-- Service role write access (cron jobs use service role key which bypasses RLS, but adding for completeness)
CREATE POLICY "Service write" ON components FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON component_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON incident_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON poll_log FOR ALL USING (true) WITH CHECK (true);

-- Seed components from Shopify's status page
INSERT INTO components (id, name, position) VALUES
  ('j2v844ncbwhc', 'Admin', 1),
  ('xxmsk7ckz5zn', 'Checkout', 2),
  ('kts17443k1tp', 'Reports and Dashboards', 3),
  ('lsbpn7k2klys', 'Storefront', 4),
  ('3yw249mdwsnm', 'API & Mobile', 5),
  ('w38t8gkl0rl3', 'Third party services', 6),
  ('681m2hqkhvdk', 'Support', 7),
  ('zqwjyv8w0j1v', 'Point of Sale', 8),
  ('hbrbr6ssntq5', 'Oxygen', 9)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position;
