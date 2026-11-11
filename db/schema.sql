-- People who asked for a free website on /free. One row per form submission.
create table if not exists leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  business text not null,
  phone text,
  email text,
  location text,
  website text,
  notes text
);

-- ─── Labs: the crafting game (labs.rushilchopra.com/craft) ─────────────────

-- Everything that exists in the game. Starters have steps = 0; anything made
-- later records the fewest combinations known to make it (the daily "par").
create table if not exists lab_craft_elements (
  name text primary key,
  emoji text not null,
  steps int not null default 0,
  created_at timestamptz not null default now()
);

-- Every pair ever combined, and what it made. One answer per pair, forever,
-- so the game is the same for everyone (and the model is asked only once).
create table if not exists lab_craft_combos (
  a text not null,
  b text not null,
  result text not null references lab_craft_elements (name),
  created_at timestamptz not null default now(),
  primary key (a, b)
);

-- One row per model call, for rate limits. IPs are stored hashed.
create table if not exists lab_craft_calls (
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists lab_craft_calls_ip_time on lab_craft_calls (ip_hash, created_at);
create index if not exists lab_craft_calls_time on lab_craft_calls (created_at);

insert into lab_craft_elements (name, emoji, steps) values
  ('Water', '💧', 0), ('Fire', '🔥', 0), ('Earth', '🌍', 0), ('Wind', '🌬️', 0)
on conflict (name) do nothing;

-- Each day's target, chosen once on the day's first visit so it never moves.
create table if not exists lab_craft_daily (
  day date primary key,
  name text not null references lab_craft_elements (name),
  par int not null
);

-- ─── Labs: analytics (labs.rushilchopra.com/stats) ─────────────────────────

-- One row per thing that happened in a lab: a view, time spent, a button
-- pressed. No raw IPs and no cookies: `visitor` is a hash that changes every
-- UTC day, `session` is a random id that lives in one browser tab.
create table if not exists lab_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  lab text not null,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  visitor text not null,
  session text,
  country text,
  device text,
  referrer text,
  path text
);
create index if not exists lab_events_time on lab_events (created_at);
create index if not exists lab_events_lab_time on lab_events (lab, created_at);
create index if not exists lab_events_lab_event_time on lab_events (lab, event, created_at);
