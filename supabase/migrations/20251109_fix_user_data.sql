-- Fix core issues for appointments to work properly

-- 1. Create missing profile for the user
INSERT INTO public.profiles (id, full_name, phone) VALUES
  ('4a021f21-2d9a-41b3-a990-71a6fe37050e'::uuid, 'Mehul Kumar Singh', '+91-98300-99999')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- 2. Delete any existing roles first to avoid conflicts
DELETE FROM public.user_roles WHERE user_id = '4a021f21-2d9a-41b3-a990-71a6fe37050e'::uuid;

-- 3. Create user roles (patient AND clinic)
INSERT INTO public.user_roles (user_id, role) VALUES
  ('4a021f21-2d9a-41b3-a990-71a6fe37050e'::uuid, 'patient'),
  ('4a021f21-2d9a-41b3-a990-71a6fe37050e'::uuid, 'clinic');

-- 4. Link your account to Park Street Medical Centre
UPDATE public.clinics SET user_id = '4a021f21-2d9a-41b3-a990-71a6fe37050e'::uuid 
WHERE clinic_name = 'Park Street Medical Centre';

-- 5. Verify the data
SELECT 'Profile check:' as check_type, id, full_name FROM public.profiles WHERE id = '4a021f21-2d9a-41b3-a990-71a6fe37050e'::uuid;
SELECT 'Roles check:' as check_type, user_id, role FROM public.user_roles WHERE user_id = '4a021f21-2d9a-41b3-a990-71a6fe37050e'::uuid;