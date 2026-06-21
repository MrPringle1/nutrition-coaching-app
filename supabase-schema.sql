-- Run this entire file in your Supabase SQL Editor

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('coach', 'client')),
  created_at timestamptz default now()
);

-- Clients
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references auth.users on delete cascade not null,
  profile_id uuid references auth.users on delete set null,
  full_name text not null,
  email text not null,
  age int,
  height text,
  current_weight numeric(5,1),
  goal_weight numeric(5,1),
  notes text,
  created_at timestamptz default now()
);

-- Meal Plans
create table public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients on delete cascade not null,
  name text not null,
  daily_calories int not null default 1600,
  daily_protein int not null default 130,
  daily_carbs int not null default 130,
  daily_fat int not null default 50,
  water_goal_oz int not null default 60,
  created_at timestamptz default now()
);

-- Meals (individual meals within a plan)
create table public.meals (
  id uuid default gen_random_uuid() primary key,
  meal_plan_id uuid references public.meal_plans on delete cascade not null,
  day_number int not null check (day_number between 1 and 7),
  meal_number int not null,
  meal_label text not null,  -- e.g. "Meal 1", "Snack"
  name text not null,
  description text not null default '',
  calories int not null default 0,
  protein int not null default 0,
  carbs int not null default 0,
  fat int not null default 0
);

-- Grocery Items
create table public.grocery_items (
  id uuid default gen_random_uuid() primary key,
  meal_plan_id uuid references public.meal_plans on delete cascade not null,
  category text not null,
  name text not null,
  checked boolean not null default false
);

-- Progress Logs
create table public.progress_logs (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients on delete cascade not null,
  logged_at timestamptz not null default now(),
  weight numeric(5,1),
  water_oz int,
  notes text
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meals enable row level security;
alter table public.grocery_items enable row level security;
alter table public.progress_logs enable row level security;

-- Profiles: users can read/update their own
create policy "profiles: own" on public.profiles for all using (auth.uid() = id);

-- Clients: coach can manage their own clients; client can read their own row
create policy "clients: coach manage" on public.clients for all
  using (auth.uid() = coach_id);

create policy "clients: client read own" on public.clients for select
  using (auth.uid() = profile_id);

-- Meal Plans: coach can manage; client can read
create policy "meal_plans: coach manage" on public.meal_plans for all
  using (exists (select 1 from public.clients c where c.id = meal_plans.client_id and c.coach_id = auth.uid()));

create policy "meal_plans: client read" on public.meal_plans for select
  using (exists (select 1 from public.clients c where c.id = meal_plans.client_id and c.profile_id = auth.uid()));

-- Meals: same as meal_plans
create policy "meals: coach manage" on public.meals for all
  using (exists (select 1 from public.meal_plans mp join public.clients c on c.id = mp.client_id where mp.id = meals.meal_plan_id and c.coach_id = auth.uid()));

create policy "meals: client read" on public.meals for select
  using (exists (select 1 from public.meal_plans mp join public.clients c on c.id = mp.client_id where mp.id = meals.meal_plan_id and c.profile_id = auth.uid()));

-- Grocery Items: coach can manage; client can read + update (for checking off)
create policy "grocery: coach manage" on public.grocery_items for all
  using (exists (select 1 from public.meal_plans mp join public.clients c on c.id = mp.client_id where mp.id = grocery_items.meal_plan_id and c.coach_id = auth.uid()));

create policy "grocery: client read+update" on public.grocery_items for select
  using (exists (select 1 from public.meal_plans mp join public.clients c on c.id = mp.client_id where mp.id = grocery_items.meal_plan_id and c.profile_id = auth.uid()));

create policy "grocery: client check off" on public.grocery_items for update
  using (exists (select 1 from public.meal_plans mp join public.clients c on c.id = mp.client_id where mp.id = grocery_items.meal_plan_id and c.profile_id = auth.uid()));

-- Progress Logs: coach can read; client can insert + read their own
create policy "progress: coach read" on public.progress_logs for select
  using (exists (select 1 from public.clients c where c.id = progress_logs.client_id and c.coach_id = auth.uid()));

create policy "progress: client manage" on public.progress_logs for all
  using (exists (select 1 from public.clients c where c.id = progress_logs.client_id and c.profile_id = auth.uid()));

-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
