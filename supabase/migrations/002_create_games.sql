-- Games table
create table public.games (
  id            uuid primary key default gen_random_uuid(),
  lobby_id      uuid not null references public.lobbies(id),
  status        text not null default 'active'
                  check (status in ('active', 'finished')),
  board_a       jsonb not null,
  board_b       jsonb not null,
  clocks        jsonb not null default '{}',
  move_history  jsonb not null default '[]',
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create index on public.games(lobby_id);
create index on public.games(status) where status = 'active';
