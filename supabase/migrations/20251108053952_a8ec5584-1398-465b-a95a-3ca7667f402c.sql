-- Drop trigger first, then function
DROP TRIGGER IF EXISTS on_auth_user_role_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_role_on_signup();

CREATE OR REPLACE FUNCTION public.handle_user_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user role from metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_role_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_role_on_signup();

-- Create trigger function to insert pharmacy data
CREATE OR REPLACE FUNCTION public.handle_pharmacy_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert pharmacy data if role is pharmacy
  IF NEW.raw_user_meta_data->>'role' = 'pharmacy' THEN
    INSERT INTO public.pharmacies (
      user_id, 
      pharmacy_name, 
      email, 
      phone, 
      address
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'address', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger function to insert clinic data
CREATE OR REPLACE FUNCTION public.handle_clinic_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert clinic data if role is clinic
  IF NEW.raw_user_meta_data->>'role' = 'clinic' THEN
    INSERT INTO public.clinics (
      user_id, 
      clinic_name, 
      email, 
      phone, 
      address
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'address', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for pharmacy
CREATE TRIGGER on_auth_user_pharmacy_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pharmacy_on_signup();

-- Create trigger for clinic
CREATE TRIGGER on_auth_user_clinic_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_clinic_on_signup();