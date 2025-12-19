-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create specialties table
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clinics table
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  clinic_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  specialty_id UUID REFERENCES public.specialties(id),
  qualification TEXT,
  experience_years INTEGER,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pharmacies table
CREATE TABLE IF NOT EXISTS public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pharmacy_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create health records table
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_type TEXT NOT NULL,
  record_date DATE NOT NULL,
  value DECIMAL(10, 2),
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (will not fail if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view specialties" ON public.specialties;
DROP POLICY IF EXISTS "Clinics can manage own data" ON public.clinics;
DROP POLICY IF EXISTS "Patients can view verified clinics" ON public.clinics;
DROP POLICY IF EXISTS "Clinic owners can manage their doctors" ON public.doctors;
DROP POLICY IF EXISTS "Patients can view doctors from verified clinics" ON public.doctors;
DROP POLICY IF EXISTS "Pharmacies can manage own data" ON public.pharmacies;
DROP POLICY IF EXISTS "Patients can view verified pharmacies" ON public.pharmacies;
DROP POLICY IF EXISTS "Patients can manage own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clinics can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clinics can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can manage own health records" ON public.health_records;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Specialties RLS policies (public read)
CREATE POLICY "Anyone can view specialties"
  ON public.specialties FOR SELECT
  TO authenticated
  USING (TRUE);

-- Clinics RLS policies
CREATE POLICY "Clinics can manage own data"
  ON public.clinics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can view verified clinics"
  ON public.clinics FOR SELECT
  TO authenticated
  USING (verified = TRUE);

-- Doctors RLS policies
CREATE POLICY "Clinic owners can manage their doctors"
  ON public.doctors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clinics
      WHERE clinics.id = doctors.clinic_id
      AND clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view doctors from verified clinics"
  ON public.doctors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinics
      WHERE clinics.id = doctors.clinic_id
      AND clinics.verified = TRUE
    )
  );

-- Pharmacies RLS policies
CREATE POLICY "Pharmacies can manage own data"
  ON public.pharmacies FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can view verified pharmacies"
  ON public.pharmacies FOR SELECT
  TO authenticated
  USING (verified = TRUE);

-- Appointments RLS policies
CREATE POLICY "Patients can manage own appointments"
  ON public.appointments FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Clinics can view their appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinics can update their appointments"
  ON public.appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.user_id = auth.uid()
    )
  );

-- Health records RLS policies
CREATE POLICY "Patients can manage own health records"
  ON public.health_records FOR ALL
  USING (auth.uid() = patient_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_clinics_updated_at ON public.clinics;
DROP TRIGGER IF EXISTS update_doctors_updated_at ON public.doctors;
DROP TRIGGER IF EXISTS update_pharmacies_updated_at ON public.pharmacies;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at
  BEFORE UPDATE ON public.pharmacies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default specialties (will not fail if they already exist)
INSERT INTO public.specialties (name, description) VALUES
  ('General Physician', 'Primary care and general health'),
  ('Cardiologist', 'Heart and cardiovascular system'),
  ('Dentist', 'Oral health and dental care'),
  ('Dermatologist', 'Skin, hair, and nail conditions'),
  ('Pediatrician', 'Children''s health and development'),
  ('Orthopedic', 'Bones, joints, and musculoskeletal system'),
  ('Gynecologist', 'Women''s reproductive health'),
  ('ENT Specialist', 'Ear, nose, and throat'),
  ('Ophthalmologist', 'Eye care and vision'),
  ('Psychiatrist', 'Mental health and psychiatric care')
ON CONFLICT (name) DO NOTHING;