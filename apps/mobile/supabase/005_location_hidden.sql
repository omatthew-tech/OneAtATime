-- =============================================
-- Add location_hidden flag and country to profiles
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_hidden boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS country text DEFAULT '';
