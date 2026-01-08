-- Add target_sectors column to events table for sector-based filtering
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS target_sectors TEXT[] DEFAULT '{}';

-- Add creator_sector to events for easier filtering
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS creator_sector TEXT;

-- Create index for faster sector filtering
CREATE INDEX IF NOT EXISTS idx_events_creator_sector ON public.events(creator_sector);
CREATE INDEX IF NOT EXISTS idx_events_target_sectors ON public.events USING GIN(target_sectors);