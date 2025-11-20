-- Create enum for user roles
create type public.app_role as enum ('admin', 'teacher', 'student');

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default now() not null,
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Policy: Users can view their own roles
create policy "Users can view their own roles"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Only admins can insert roles
create policy "Admins can insert roles"
  on public.user_roles
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Policy: Only admins can delete roles
create policy "Admins can delete roles"
  on public.user_roles
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create profiles table for additional user data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policy: Users can view all profiles
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Policy: Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- Policy: Users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Create trigger for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

-- Insert demo users for testing (run these manually after creating users in Supabase Auth)
-- These are placeholders - actual users must be created through Supabase Auth UI
comment on table public.user_roles is 'Stores user roles. Create users via Supabase Auth, then assign roles here.';
comment on table public.profiles is 'Stores additional user profile data like name and avatar.';