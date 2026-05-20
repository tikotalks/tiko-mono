CREATE TABLE IF NOT EXISTS issue_reports (
  id TEXT PRIMARY KEY,
  app_name TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('bug', 'feature', 'improvement', 'other')),
  description TEXT NOT NULL,
  user_email TEXT,
  build_info TEXT,
  user_agent TEXT NOT NULL DEFAULT '',
  metadata TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triaged', 'closed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS issue_reports_app_created_idx
  ON issue_reports (app_name, created_at DESC);

CREATE INDEX IF NOT EXISTS issue_reports_status_created_idx
  ON issue_reports (status, created_at DESC);
