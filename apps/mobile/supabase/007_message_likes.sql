-- =============================================
-- Migration 007: Message likes (double-tap to heart)
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS liked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
