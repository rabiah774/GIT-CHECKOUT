-- Create medicine orders table
CREATE TABLE public.medicine_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE NOT NULL,
  medicines TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery', 'online')),
  is_urgent BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medicine orders
CREATE POLICY "Patients can create own orders"
  ON public.medicine_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can view own orders"
  ON public.medicine_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Pharmacies can view their orders"
  ON public.medicine_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pharmacies
      WHERE pharmacies.id = medicine_orders.pharmacy_id
      AND pharmacies.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacies can update their orders"
  ON public.medicine_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pharmacies
      WHERE pharmacies.id = medicine_orders.pharmacy_id
      AND pharmacies.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_medicine_orders_updated_at
  BEFORE UPDATE ON public.medicine_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
