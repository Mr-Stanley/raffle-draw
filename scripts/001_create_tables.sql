-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create raffles table
create table if not exists public.raffles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text not null check (status in ('upcoming', 'live', 'completed')),
  draw_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Create prizes table
create table if not exists public.prizes (
  id uuid primary key default uuid_generate_v4(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('lunch_voucher', 'data_voucher', 'airtime', 'cash_token')),
  value numeric not null,
  quantity int not null default 1,
  remaining int not null default 1,
  created_at timestamptz default now()
);

-- Create participants table
create table if not exists public.participants (
  id uuid primary key default uuid_generate_v4(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  entry_code text unique not null,
  created_at timestamptz default now(),
  constraint unique_participant_per_raffle unique (raffle_id, email)
);

-- Create winners table
create table if not exists public.winners (
  id uuid primary key default uuid_generate_v4(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  prize_id uuid not null references public.prizes(id) on delete cascade,
  won_at timestamptz default now(),
  notified boolean default false,
  constraint unique_winner_per_prize unique (raffle_id, participant_id, prize_id)
);

-- Create admin profiles table
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.raffles enable row level security;
alter table public.prizes enable row level security;
alter table public.participants enable row level security;
alter table public.winners enable row level security;
alter table public.admin_profiles enable row level security;

-- RLS Policies for raffles
create policy "Anyone can view raffles"
  on public.raffles for select
  using (true);

create policy "Only admins can insert raffles"
  on public.raffles for insert
  with check (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

create policy "Only admins can update raffles"
  on public.raffles for update
  using (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

create policy "Only admins can delete raffles"
  on public.raffles for delete
  using (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

-- RLS Policies for prizes
create policy "Anyone can view prizes"
  on public.prizes for select
  using (true);

create policy "Only admins can manage prizes"
  on public.prizes for all
  using (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

-- RLS Policies for participants
create policy "Anyone can view participants"
  on public.participants for select
  using (true);

create policy "Anyone can insert participants"
  on public.participants for insert
  with check (true);

create policy "Only admins can update participants"
  on public.participants for update
  using (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

create policy "Only admins can delete participants"
  on public.participants for delete
  using (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

-- RLS Policies for winners
create policy "Anyone can view winners"
  on public.winners for select
  using (true);

create policy "Only admins can manage winners"
  on public.winners for all
  using (
    exists (
      select 1 from public.admin_profiles
      where id = auth.uid()
    )
  );

-- RLS Policies for admin_profiles
-- Fixed: Direct check to avoid infinite recursion
-- Users can view their own admin profile
create policy "Users can view their own admin profile"
  on public.admin_profiles for select
  using (id = auth.uid());

-- Allow inserts for the trigger function (security definer bypasses RLS, but this helps)
-- Also allows users to insert their own profile if needed
create policy "Allow admin profile inserts"
  on public.admin_profiles for insert
  with check (id = auth.uid());

-- Create indexes for better performance
create index if not exists idx_raffles_status on public.raffles(status);
create index if not exists idx_prizes_raffle_id on public.prizes(raffle_id);
create index if not exists idx_participants_raffle_id on public.participants(raffle_id);
create index if not exists idx_participants_entry_code on public.participants(entry_code);
create index if not exists idx_winners_raffle_id on public.winners(raffle_id);
create index if not exists idx_winners_participant_id on public.winners(participant_id);
