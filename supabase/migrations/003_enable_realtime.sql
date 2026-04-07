-- Enable Row Level Security (open policies — no user auth)
alter table public.lobbies enable row level security;
alter table public.lobby_players enable row level security;
alter table public.games enable row level security;

-- Lobbies policies
create policy "public select lobbies" on public.lobbies for select using (true);
create policy "public insert lobbies" on public.lobbies for insert with check (true);
create policy "public update lobbies" on public.lobbies for update using (true);

-- Lobby players policies
create policy "public select lobby_players" on public.lobby_players for select using (true);
create policy "public insert lobby_players" on public.lobby_players for insert with check (true);
create policy "public delete lobby_players" on public.lobby_players for delete using (true);

-- Games policies
create policy "public select games" on public.games for select using (true);
create policy "public insert games" on public.games for insert with check (true);
create policy "public update games" on public.games for update using (true);

-- Enable Realtime for these tables
alter publication supabase_realtime add table public.lobbies;
alter publication supabase_realtime add table public.lobby_players;
alter publication supabase_realtime add table public.games;
