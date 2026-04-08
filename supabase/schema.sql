create table if not exists public.favorite_meals (
  household_slug text not null default 'default',
  meal_type text not null check (meal_type in ('family', 'kids')),
  meal_key text not null,
  name text not null,
  description text not null,
  created_at timestamptz not null default now(),
  primary key (household_slug, meal_type, meal_key)
);

create table if not exists public.day_settings (
  household_slug text not null default 'default',
  day_name text not null,
  family_meal_id text not null,
  kids_meal_id text not null,
  use_kids_meal boolean not null default false,
  family_shuffles_used integer not null default 0 check (family_shuffles_used >= 0),
  kids_shuffles_used integer not null default 0 check (kids_shuffles_used >= 0),
  updated_at timestamptz not null default now(),
  primary key (household_slug, day_name)
);

create table if not exists public.family_members (
  household_slug text not null default 'default',
  member_key text not null,
  name text not null,
  role text not null default 'Family',
  color text not null default '#7b6ef6',
  created_at timestamptz not null default now(),
  primary key (household_slug, member_key)
);

create table if not exists public.meal_member_preferences (
  household_slug text not null default 'default',
  meal_key text not null,
  member_key text not null,
  created_at timestamptz not null default now(),
  primary key (household_slug, meal_key, member_key)
);

alter table public.favorite_meals enable row level security;
alter table public.day_settings enable row level security;
alter table public.family_members enable row level security;
alter table public.meal_member_preferences enable row level security;

drop policy if exists "public favorite meals read" on public.favorite_meals;
create policy "public favorite meals read"
on public.favorite_meals
for select
to anon, authenticated
using (true);

drop policy if exists "public favorite meals write" on public.favorite_meals;
create policy "public favorite meals write"
on public.favorite_meals
for insert
to anon, authenticated
with check (true);

drop policy if exists "public favorite meals update" on public.favorite_meals;
create policy "public favorite meals update"
on public.favorite_meals
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public day settings read" on public.day_settings;
create policy "public day settings read"
on public.day_settings
for select
to anon, authenticated
using (true);

drop policy if exists "public day settings write" on public.day_settings;
create policy "public day settings write"
on public.day_settings
for insert
to anon, authenticated
with check (true);

drop policy if exists "public day settings update" on public.day_settings;
create policy "public day settings update"
on public.day_settings
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public family members read" on public.family_members;
create policy "public family members read"
on public.family_members
for select
to anon, authenticated
using (true);

drop policy if exists "public family members write" on public.family_members;
create policy "public family members write"
on public.family_members
for insert
to anon, authenticated
with check (true);

drop policy if exists "public family members update" on public.family_members;
create policy "public family members update"
on public.family_members
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public meal likes read" on public.meal_member_preferences;
create policy "public meal likes read"
on public.meal_member_preferences
for select
to anon, authenticated
using (true);

drop policy if exists "public meal likes write" on public.meal_member_preferences;
create policy "public meal likes write"
on public.meal_member_preferences
for insert
to anon, authenticated
with check (true);

drop policy if exists "public meal likes delete" on public.meal_member_preferences;
create policy "public meal likes delete"
on public.meal_member_preferences
for delete
to anon, authenticated
using (true);
