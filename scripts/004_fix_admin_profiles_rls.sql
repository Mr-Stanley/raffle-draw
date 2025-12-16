-- Fix infinite recursion in admin_profiles RLS policies
-- Drop existing policies
drop policy if exists "Admins can view all admin profiles" on public.admin_profiles;
drop policy if exists "Admins can insert admin profiles" on public.admin_profiles;

-- Create new policies that don't cause recursion
-- Allow users to see their own admin profile
create policy "Users can view their own admin profile"
  on public.admin_profiles for select
  using (id = auth.uid());

-- Allow inserts for the trigger function (security definer bypasses RLS, but this helps)
-- Also allows users to insert their own profile if needed
create policy "Allow admin profile inserts"
  on public.admin_profiles for insert
  with check (id = auth.uid());

-- Note: The trigger function uses SECURITY DEFINER, so it bypasses RLS
-- But having this policy ensures consistency

