-- Allow clinics to view patient profiles for appointments
-- This is needed so clinic dashboards can show patient names

CREATE POLICY "Clinics can view patient profiles for their appointments"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    -- Allow if the profile belongs to a patient who has an appointment at this clinic
    EXISTS (
      SELECT 1 
      FROM public.appointments a
      JOIN public.clinics c ON c.id = a.clinic_id
      WHERE a.patient_id = profiles.id
      AND c.user_id = auth.uid()
    )
  );

-- Ensure users can read their own roles (fix 406 error)
-- Drop existing policy if it exists and recreate it
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);