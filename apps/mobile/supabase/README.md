# Supabase Setup

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Core user data: name, age, gender, introversion, bio, location, device_id, preferences |
| `photos` | User photos (up to 6, ordered) — stored in Supabase Storage, public_url cached |
| `prompt_answers` | Answers to conversation prompts shown on profiles |
| `question_answers` | Answers to 10 compatibility questions |
| `matches` | One-at-a-time matches between two users |
| `messages` | Chat messages within a match |
| `swipes` | Like/pass actions for the discovery feed |

## How to set up (fresh project)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon public key** from Settings > API
3. Create a `.env` file in `apps/mobile/` with those values (see `.env.example`)
4. Open the **SQL Editor** in your Supabase dashboard
5. Paste the contents of `schema.sql` and click **Run**
6. Create a Storage bucket called `photos` (Dashboard > Storage > New bucket, set to **public**)

## Migrations (existing project)

If you already ran the original `schema.sql`, run migration files in order:

1. `002_device_id.sql` — adds `device_id`, `preferences` columns to profiles, `public_url` to photos

Open each file in the SQL Editor and click **Run**.

## Environment variables

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

## Anonymous-first accounts

Users are identified by a `device_id` stored on the device via `expo-secure-store`. No email or password is required. Users can optionally link an email later from the Me screen for account recovery.

A profile only appears in other users' Discover feeds once it has at least one photo uploaded.
