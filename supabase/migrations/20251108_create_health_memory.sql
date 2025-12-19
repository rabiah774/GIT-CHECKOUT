-- Create health memory tables for tracking patient health timeline

-- Health memory entries table (main timeline)
CREATE TABLE public.health_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('doctor_visit', 'symptom', 'medicine')),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  severity INTEGER CHECK (severity >= 1 AND severity <= 5), -- 1=mild, 5=severe (for symptoms)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor visits (auto-populated from appointments)
CREATE TABLE public.health_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_memory_id UUID REFERENCES public.health_memory(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  clinic_name TEXT NOT NULL,
  doctor_name TEXT,
  specialty TEXT,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT
);

-- Symptoms tracking
CREATE TABLE public.health_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_memory_id UUID REFERENCES public.health_memory(id) ON DELETE CASCADE NOT NULL,
  symptom_name TEXT NOT NULL,
  body_part TEXT,
  duration_days INTEGER,
  triggers TEXT,
  relief_methods TEXT
);

-- Medicine tracking
CREATE TABLE public.health_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_memory_id UUID REFERENCES public.health_memory(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration_days INTEGER,
  prescribed_by TEXT,
  side_effects TEXT,
  effectiveness INTEGER CHECK (effectiveness >= 1 AND effectiveness <= 5) -- 1=not effective, 5=very effective
);

-- Enable RLS
ALTER TABLE public.health_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_medicines ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Patients can only access their own health data
CREATE POLICY "Patients can manage own health memory"
  ON public.health_memory FOR ALL
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can manage own health visits"
  ON public.health_visits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.health_memory
      WHERE health_memory.id = health_visits.health_memory_id
      AND health_memory.patient_id = auth.uid()
    )
  );

CREATE POLICY "Patients can manage own health symptoms"
  ON public.health_symptoms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.health_memory
      WHERE health_memory.id = health_symptoms.health_memory_id
      AND health_memory.patient_id = auth.uid()
    )
  );

CREATE POLICY "Patients can manage own health medicines"
  ON public.health_medicines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.health_memory
      WHERE health_memory.id = health_medicines.health_memory_id
      AND health_memory.patient_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_health_memory_updated_at
  BEFORE UPDATE ON public.health_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create health memory entry when appointment is completed
CREATE OR REPLACE FUNCTION public.create_health_memory_from_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create entry when appointment status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Insert health memory entry
    INSERT INTO public.health_memory (
      patient_id,
      entry_type,
      title,
      description,
      date
    ) VALUES (
      NEW.patient_id,
      'doctor_visit',
      'Doctor Visit',
      'Appointment completed',
      NEW.appointment_date
    );
    
    -- Get the health memory ID and create visit details
    INSERT INTO public.health_visits (
      health_memory_id,
      appointment_id,
      clinic_name,
      doctor_name,
      specialty
    )
    SELECT 
      hm.id,
      NEW.id,
      c.clinic_name,
      d.name,
      s.name
    FROM public.health_memory hm
    LEFT JOIN public.clinics c ON c.id = NEW.clinic_id
    LEFT JOIN public.doctors d ON d.id = NEW.doctor_id
    LEFT JOIN public.specialties s ON s.id = d.specialty_id
    WHERE hm.patient_id = NEW.patient_id
    AND hm.entry_type = 'doctor_visit'
    AND hm.date = NEW.appointment_date
    ORDER BY hm.created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating health memory from appointments
CREATE TRIGGER auto_create_health_memory_from_appointment
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_health_memory_from_appointment();