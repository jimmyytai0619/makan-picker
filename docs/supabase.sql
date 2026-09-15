-- Database setup for Makan Apa? (run once in Supabase → SQL Editor).
--
-- The shared list of places removed because they closed down.
-- api/_removedStore.js reads and writes it through Supabase's REST API.

create table public.removed_places (
  id          text primary key check (id ~ '^osm-(node|way|relation)-[0-9]{1,15}$'),
  name        text not null check (char_length(name) between 1 and 120),
  category    text not null check (category ~ '^[a-z_]{1,20}$'),
  removed_at  timestamptz not null default now()
);

-- Row Level Security ON, with no policies: the public (anon) key can't read or
-- change this table. Only our server, using the secret key, can.
-- The checks above repeat the server's input rules as a second safety net.
alter table public.removed_places enable row level security;
