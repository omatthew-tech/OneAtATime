-- =============================================
-- Migration 008: Match countdown timer
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS timer_deadline timestamptz DEFAULT (now() + interval '24 hours'),
  ADD COLUMN IF NOT EXISTS last_sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
