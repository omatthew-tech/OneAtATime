-- =============================================
-- Add extended profile fields to profiles table
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS height text default '',
  ADD COLUMN IF NOT EXISTS job text default '',
  ADD COLUMN IF NOT EXISTS school text default '',
  ADD COLUMN IF NOT EXISTS religion text default '',
  ADD COLUMN IF NOT EXISTS hometown text default '',
  ADD COLUMN IF NOT EXISTS politics text default '',
  ADD COLUMN IF NOT EXISTS language text default '';
