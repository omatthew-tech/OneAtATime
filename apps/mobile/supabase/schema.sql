-- =============================================
-- OneAtATime Dating App — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- PROFILES: core user table
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  device_id text unique,
  email text unique,
  name text not null,
  age integer not null check (age >= 18 and age <= 120),
  gender text not null check (gender in ('Man', 'Woman', 'Nonbinary')),
  introversion text not null check (introversion in ('Introvert', 'Omnivert', 'Extrovert')),
  bio text default '',
  location_text text default '',
  latitude double precision,
  longitude double precision,
  preferences jsonb default '{}',
  is_onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PHOTOS: up to 6 per user, ordered
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  public_url text,
  display_order integer not null default 0,
  created_at timestamptz default now()
);

create index idx_photos_profile on public.photos(profile_id);

-- PROMPTS: user answers to conversation prompts
create table public.prompt_answers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  prompt_text text not null,
  answer text not null,
  display_order integer not null default 0,
  created_at timestamptz default now()
);

create index idx_prompts_profile on public.prompt_answers(profile_id);

-- QUESTIONS: 10 personality/compatibility questions
create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  question_key text not null,
  answer text not null,
  created_at timestamptz default now(),
  unique(profile_id, question_key)
);

create index idx_questions_profile on public.question_answers(profile_id);

-- MATCHES: one-at-a-time matching
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  check (user_a <> user_b)
);

create index idx_matches_user_a on public.matches(user_a);
create index idx_matches_user_b on public.matches(user_b);

-- MESSAGES: chat between matched users
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create index idx_messages_match on public.messages(match_id, created_at);

-- SWIPES: track who has been shown / skipped
create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('like', 'pass')),
  created_at timestamptz default now(),
  unique(swiper_id, target_id)
);

create index idx_swipes_swiper on public.swipes(swiper_id);

-- Auto-update updated_at on profiles
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- STORAGE BUCKET for photos (create via Dashboard or API)
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

-- ROW LEVEL SECURITY (enable after adding auth)
-- alter table public.profiles enable row level security;
-- alter table public.photos enable row level security;
-- alter table public.prompt_answers enable row level security;
-- alter table public.question_answers enable row level security;
-- alter table public.matches enable row level security;
-- alter table public.messages enable row level security;
-- alter table public.swipes enable row level security;
