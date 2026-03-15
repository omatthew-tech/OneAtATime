-- =============================================
-- Migration 002: Add device_id, preferences, photo public_url
-- Run this in: Supabase Dashboard > SQL Editor
-- Only needed if you already ran the original schema.sql
-- =============================================

-- Anonymous identity column
alter table public.profiles add column if not exists device_id text unique;

-- User preferences (age range, distance, interested-in genders)
alter table public.profiles add column if not exists preferences jsonb default '{}';

-- Public URL for photos (cached from Supabase Storage)
alter table public.photos add column if not exists public_url text;
