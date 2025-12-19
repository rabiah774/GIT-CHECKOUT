-- Step 1: Make user_id nullable for test data
ALTER TABLE public.clinics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.pharmacies ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Insert dummy clinics
INSERT INTO public.clinics (clinic_name, email, phone, address, verified, latitude, longitude) VALUES
  ('Park Street Medical Centre', 'contact@parkstreetmedical.com', '+91-98300-12345', '12 Park Street, Central Kolkata', TRUE, 22.5521, 88.3515),
  ('Salt Lake City Hospital', 'info@saltlakehospital.com', '+91-98300-23456', '45 Sector V, Salt Lake City', TRUE, 22.5726, 88.4331),
  ('Gariahat Clinic & Diagnostics', 'hello@gariahatclinic.com', '+91-98300-34567', '78 Gariahat Road, Dhakuria', TRUE, 22.5167, 88.3639),
  ('Howrah Multispecialty Hospital', 'contact@howrahhospital.com', '+91-98300-45678', '23 Grand Trunk Road, Howrah', TRUE, 22.5958, 88.2636);

-- Step 3: Insert dummy pharmacies
INSERT INTO public.pharmacies (pharmacy_name, email, phone, address, verified, latitude, longitude) VALUES
  ('Apollo Pharmacy Park Street', 'contact@apolloparkst.com', '+91-98300-56789', '15 Park Street, Near Metro', TRUE, 22.5521, 88.3520),
  ('MedPlus Gariahat', 'info@medplusgariahat.com', '+91-98300-67890', '89 Rashbehari Avenue, Gariahat', TRUE, 22.5167, 88.3645),
  ('HealthBuddy Salt Lake', 'hello@healthbuddysaltlake.com', '+91-98300-78901', '12 Tank No 5, Salt Lake', TRUE, 22.5726, 88.4340),
  ('Wellness Pharmacy Howrah', 'support@wellnesshowrah.com', '+91-98300-89012', '56 Foreshore Road, Howrah', TRUE, 22.5958, 88.2640);

-- Step 4: Add doctors to clinics
DO $$
DECLARE
  clinic1_id UUID;
  clinic2_id UUID;
  clinic3_id UUID;
  clinic4_id UUID;
  gp_specialty_id UUID;
  cardio_specialty_id UUID;
  dentist_specialty_id UUID;
  pediatric_specialty_id UUID;
  ortho_specialty_id UUID;
BEGIN
  -- Get clinic IDs
  SELECT id INTO clinic1_id FROM public.clinics WHERE clinic_name = 'Park Street Medical Centre' LIMIT 1;
  SELECT id INTO clinic2_id FROM public.clinics WHERE clinic_name = 'Salt Lake City Hospital' LIMIT 1;
  SELECT id INTO clinic3_id FROM public.clinics WHERE clinic_name = 'Gariahat Clinic & Diagnostics' LIMIT 1;
  SELECT id INTO clinic4_id FROM public.clinics WHERE clinic_name = 'Howrah Multispecialty Hospital' LIMIT 1;
  
  -- Get specialty IDs
  SELECT id INTO gp_specialty_id FROM public.specialties WHERE name = 'General Physician' LIMIT 1;
  SELECT id INTO cardio_specialty_id FROM public.specialties WHERE name = 'Cardiologist' LIMIT 1;
  SELECT id INTO dentist_specialty_id FROM public.specialties WHERE name = 'Dentist' LIMIT 1;
  SELECT id INTO pediatric_specialty_id FROM public.specialties WHERE name = 'Pediatrician' LIMIT 1;
  SELECT id INTO ortho_specialty_id FROM public.specialties WHERE name = 'Orthopedic' LIMIT 1;
  
  -- Insert doctors for Park Street Medical Centre
  IF clinic1_id IS NOT NULL THEN
    INSERT INTO public.doctors (clinic_id, name, specialty_id, qualification, experience_years, available) VALUES
      (clinic1_id, 'Dr. Ananya Mukherjee', gp_specialty_id, 'MBBS, MD', 10, TRUE),
      (clinic1_id, 'Dr. Rajesh Sharma', cardio_specialty_id, 'MBBS, DM Cardiology', 15, TRUE);
  END IF;
  
  -- Insert doctors for Salt Lake City Hospital
  IF clinic2_id IS NOT NULL THEN
    INSERT INTO public.doctors (clinic_id, name, specialty_id, qualification, experience_years, available) VALUES
      (clinic2_id, 'Dr. Priya Banerjee', pediatric_specialty_id, 'MBBS, MD Pediatrics', 8, TRUE),
      (clinic2_id, 'Dr. Amit Das', ortho_specialty_id, 'MBBS, MS Orthopedics', 12, TRUE);
  END IF;
  
  -- Insert doctors for Gariahat Clinic & Diagnostics
  IF clinic3_id IS NOT NULL THEN
    INSERT INTO public.doctors (clinic_id, name, specialty_id, qualification, experience_years, available) VALUES
      (clinic3_id, 'Dr. Sanjay Ghosh', dentist_specialty_id, 'BDS, MDS', 7, TRUE),
      (clinic3_id, 'Dr. Ritu Sen', gp_specialty_id, 'MBBS, MD', 20, TRUE);
  END IF;
  
  -- Insert doctors for Howrah Multispecialty Hospital
  IF clinic4_id IS NOT NULL THEN
    INSERT INTO public.doctors (clinic_id, name, specialty_id, qualification, experience_years, available) VALUES
      (clinic4_id, 'Dr. Debashis Roy', cardio_specialty_id, 'MBBS, DM Cardiology', 18, TRUE),
      (clinic4_id, 'Dr. Kavita Chatterjee', gp_specialty_id, 'MBBS, MD', 14, TRUE);
  END IF;
END $$;
