-- Create deployment_events table for tracking deployments
CREATE TABLE IF NOT EXISTS public.deployment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id TEXT NOT NULL,
    status TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployment_events_target_id ON public.deployment_events(target_id);
CREATE INDEX IF NOT EXISTS idx_deployment_events_status ON public.deployment_events(status);
CREATE INDEX IF NOT EXISTS idx_deployment_events_created_at ON public.deployment_events(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.deployment_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only authenticated users can read deployment events
CREATE POLICY "Users can read deployment events" ON public.deployment_events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can insert deployment events
CREATE POLICY "Users can insert deployment events" ON public.deployment_events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deployment_events_updated_at
    BEFORE UPDATE ON public.deployment_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.deployment_events IS 'Tracks deployment events and status for monitoring';
COMMENT ON COLUMN public.deployment_events.target_id IS 'Deployment target identifier (app, tool, website, worker)';
COMMENT ON COLUMN public.deployment_events.status IS 'Deployment status (triggered, running, success, failed)';
COMMENT ON COLUMN public.deployment_events.metadata IS 'Additional deployment metadata (commit, user, etc.)';