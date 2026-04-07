-- Lobbies table
create table public.lobbies (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  host_id             text not null,
  status              text not null default 'waiting'
                        check (status in ('waiting', 'starting', 'in_game')),
  time_control_seconds int not null default 180,
  game_id             uuid,
  created_at          timestamptz not null default now()
);

-- Lobby players (seats)
create table public.lobby_players (
  id          uuid primary key default gen_random_uuid(),
  lobby_id    uuid not null references public.lobbies(id) on delete cascade,
  player_id   text not null,
  player_name text not null,
  seat        text not null
                check (seat in ('A_white', 'A_black', 'B_white', 'B_black')),
  joined_at   timestamptz not null default now(),
  unique (lobby_id, player_id),
  unique (lobby_id, seat)
);

-- Index for open lobby queries
create index on public.lobbies(status) where status = 'waiting';
create index on public.lobby_players(lobby_id);
