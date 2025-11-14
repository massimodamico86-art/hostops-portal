-- PMS Connections table for storing integration credentials and sync status

CREATE TABLE IF NOT EXISTS public.pms_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one connection per listing
  UNIQUE(listing_id)
);

-- Create index for faster lookups
CREATE INDEX idx_pms_connections_listing_id ON public.pms_connections(listing_id);
CREATE INDEX idx_pms_connections_provider ON public.pms_connections(provider);
CREATE INDEX idx_pms_connections_active ON public.pms_connections(is_active);

-- Enable RLS
ALTER TABLE public.pms_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own PMS connections"
  ON public.pms_connections
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own PMS connections"
  ON public.pms_connections
  FOR INSERT
  WITH CHECK (
    listing_id IN (
      SELECT id FROM public.listings WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own PMS connections"
  ON public.pms_connections
  FOR UPDATE
  USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own PMS connections"
  ON public.pms_connections
  FOR DELETE
  USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_pms_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pms_connections_updated_at
  BEFORE UPDATE ON public.pms_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pms_connections_updated_at();

-- Grant permissions
GRANT ALL ON public.pms_connections TO authenticated;
