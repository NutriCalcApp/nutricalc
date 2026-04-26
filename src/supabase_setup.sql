-- ================================================================
-- NUTRIALC - SUPABASE SETUP
-- Incolla questo codice nell'editor SQL di Supabase
-- Dashboard → SQL Editor → New Query → incolla → Run
-- ================================================================

-- 1. Tabella profili utente
create table if not exists profiles (
  id            uuid references auth.users primary key,
  gender        text,
  age           text,
  weight        text,
  height        text,
  activity      float,
  goal          text,
  num_meals     int,
  body_fat      text,
  updated_at    timestamptz default now()
);

-- 2. Storico pesi
create table if not exists weight_logs (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users not null,
  date        text not null,
  weight      numeric not null,
  unique(user_id, date)
);

-- 3. Pasti preferiti
create table if not exists favorites (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users not null,
  fav_id      bigint,
  name        text,
  meal_type   text,
  items       jsonb,
  created_at  timestamptz default now()
);

-- ================================================================
-- ROW LEVEL SECURITY (ogni utente vede solo i suoi dati)
-- ================================================================

alter table profiles    enable row level security;
alter table weight_logs enable row level security;
alter table favorites   enable row level security;

-- profiles
create policy "profiles_select" on profiles for select using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- weight_logs
create policy "weights_all" on weight_logs for all using (auth.uid() = user_id);

-- favorites
create policy "favorites_all" on favorites for all using (auth.uid() = user_id);

-- ================================================================
-- MIGRATION: Supporto multilingua (esegui una volta in Supabase SQL Editor)
-- ================================================================
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'it';
