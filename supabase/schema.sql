create table if not exists public.workspace_snapshots (
  user_id text primary key,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspace_snapshots enable row level security;

create policy "Users can read their own workspace snapshot"
  on public.workspace_snapshots for select
  using (auth.uid()::text = user_id);

create policy "Users can insert their own workspace snapshot"
  on public.workspace_snapshots for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update their own workspace snapshot"
  on public.workspace_snapshots for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
