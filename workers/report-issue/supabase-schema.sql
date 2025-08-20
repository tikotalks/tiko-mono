-- Create issue_reports table
CREATE TABLE IF NOT EXISTS issue_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('bug', 'feature', 'improvement', 'other')),
  description TEXT NOT NULL,
  user_email TEXT,
  build_info JSONB,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_issue_reports_app_name ON issue_reports(app_name);
CREATE INDEX IF NOT EXISTS idx_issue_reports_issue_type ON issue_reports(issue_type);
CREATE INDEX IF NOT EXISTS idx_issue_reports_created_at ON issue_reports(created_at);

-- Enable Row Level Security
ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (used by the worker)
CREATE POLICY "Service role can manage issue reports" ON issue_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: Policy for authenticated users to view their own reports (if needed later)
CREATE POLICY "Users can view their own reports" ON issue_reports
  FOR SELECT USING (user_email = auth.email());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_issue_reports_updated_at 
  BEFORE UPDATE ON issue_reports 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();