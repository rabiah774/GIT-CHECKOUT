-- Create pharmacy stock management table
CREATE TABLE public.pharmacy_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  unit TEXT DEFAULT 'pieces', -- pieces, bottles, strips, etc.
  purchase_price DECIMAL(10, 2) NOT NULL CHECK (purchase_price >= 0),
  selling_price DECIMAL(10, 2) NOT NULL CHECK (selling_price >= 0),
  purchase_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  supplier_name TEXT,
  supplier_contact TEXT,
  storage_location TEXT, -- shelf number, section, etc.
  minimum_stock_level INTEGER DEFAULT 10,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure batch numbers are unique per pharmacy
  UNIQUE(pharmacy_id, batch_number)
);

-- Create index for faster queries
CREATE INDEX idx_pharmacy_stock_pharmacy_id ON public.pharmacy_stock(pharmacy_id);
CREATE INDEX idx_pharmacy_stock_medicine_name ON public.pharmacy_stock(medicine_name);
CREATE INDEX idx_pharmacy_stock_expiry_date ON public.pharmacy_stock(expiry_date);
CREATE INDEX idx_pharmacy_stock_quantity ON public.pharmacy_stock(quantity);

-- Enable RLS
ALTER TABLE public.pharmacy_stock ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Pharmacies can only manage their own stock
CREATE POLICY "Pharmacies can manage own stock"
  ON public.pharmacy_stock FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pharmacies
      WHERE pharmacies.id = pharmacy_stock.pharmacy_id
      AND pharmacies.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_pharmacy_stock_updated_at
  BEFORE UPDATE ON public.pharmacy_stock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for low stock alerts
CREATE VIEW public.pharmacy_low_stock AS
SELECT 
  ps.*,
  p.pharmacy_name,
  CASE 
    WHEN ps.quantity <= ps.minimum_stock_level THEN 'low'
    WHEN ps.quantity <= (ps.minimum_stock_level * 1.5) THEN 'warning'
    ELSE 'normal'
  END as stock_status,
  CASE 
    WHEN ps.expiry_date <= CURRENT_DATE THEN 'expired'
    WHEN ps.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN ps.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_later'
    ELSE 'good'
  END as expiry_status
FROM public.pharmacy_stock ps
JOIN public.pharmacies p ON p.id = ps.pharmacy_id
WHERE ps.quantity <= ps.minimum_stock_level 
   OR ps.expiry_date <= CURRENT_DATE + INTERVAL '90 days';

-- Create view for expired medicines
CREATE VIEW public.pharmacy_expired_stock AS
SELECT 
  ps.*,
  p.pharmacy_name
FROM public.pharmacy_stock ps
JOIN public.pharmacies p ON p.id = ps.pharmacy_id
WHERE ps.expiry_date <= CURRENT_DATE;

-- Insert some sample medicine categories for reference
CREATE TABLE public.medicine_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.medicine_categories (name, description) VALUES
  ('Analgesics', 'Pain relievers and anti-inflammatory drugs'),
  ('Antibiotics', 'Antimicrobial medications'),
  ('Antacids', 'Stomach acid neutralizers'),
  ('Vitamins', 'Vitamin and mineral supplements'),
  ('Cough & Cold', 'Respiratory system medications'),
  ('Diabetes', 'Blood sugar management medications'),
  ('Hypertension', 'Blood pressure medications'),
  ('Skin Care', 'Topical treatments and ointments'),
  ('Eye Care', 'Ophthalmic preparations'),
  ('First Aid', 'Emergency and wound care supplies');

-- Enable RLS for categories (read-only for all authenticated users)
ALTER TABLE public.medicine_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view medicine categories"
  ON public.medicine_categories FOR SELECT
  TO authenticated
  USING (TRUE);