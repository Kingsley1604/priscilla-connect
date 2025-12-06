-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (id, name, is_profile_complete)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert student role for new user (default role)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$;

-- Create trigger to run on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also update the user_roles INSERT policy to allow any authenticated user to insert their own role
DROP POLICY IF EXISTS "Users can insert own student role" ON public.user_roles;
CREATE POLICY "Users can insert own student role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure profiles policy allows self-insert
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);