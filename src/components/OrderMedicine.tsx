import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pharmacy {
  id: string;
  pharmacy_name: string;
  address?: string;
}

interface OrderMedicineProps {
  onSuccess?: () => void;
}

export const OrderMedicine = ({ onSuccess }: OrderMedicineProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState("");
  const [medicines, setMedicines] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchPharmacies();
      fetchUserProfile();
    }
  }, [open]);

  const fetchPharmacies = async () => {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id, pharmacy_name, address')
      .order('pharmacy_name');
    
    if (!error && data) {
      setPharmacies(data);
    } else if (error) {
      console.error('Error fetching pharmacies:', error);
      toast.error('Failed to load pharmacies');
    }
  };

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single();

    if (!error && data?.phone) {
      setPhone(data.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to order medicines");
        return;
      }

      const { error } = await supabase
        .from('medicine_orders')
        .insert({
          patient_id: user.id,
          pharmacy_id: selectedPharmacy,
          medicines: medicines,
          delivery_address: deliveryAddress,
          phone: phone,
          payment_method: paymentMethod,
          is_urgent: isUrgent,
          notes: notes || null,
          status: 'pending'
        });

      if (error) {
        console.error('Order error:', error);
        toast.error("Failed to place order");
      } else {
        toast.success("Medicine order placed successfully!");
        setOpen(false);
        resetForm();
        onSuccess?.();
      }
    } catch (err) {
      console.error('Order exception:', err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPharmacy("");
    setMedicines("");
    setDeliveryAddress("");
    setPaymentMethod("cash_on_delivery");
    setIsUrgent(false);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs px-3 py-2 w-full sm:w-auto">
          <Package className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Order Medicine</span>
          <span className="sm:hidden">Order</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Medicine</DialogTitle>
          <DialogDescription>
            Select a pharmacy and provide your medicine requirements
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pharmacy">Select Pharmacy</Label>
            <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy} required>
              <SelectTrigger id="pharmacy">
                <SelectValue placeholder="Choose a pharmacy" />
              </SelectTrigger>
              <SelectContent>
                {pharmacies.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No pharmacies available</div>
                ) : (
                  pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{pharmacy.pharmacy_name}</span>
                        {pharmacy.address && (
                          <span className="text-xs text-muted-foreground">{pharmacy.address}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicines">Medicines Required</Label>
            <Textarea
              id="medicines"
              placeholder="List the medicines you need (e.g., Paracetamol 500mg - 10 tablets, Cough syrup - 1 bottle)"
              value={medicines}
              onChange={(e) => setMedicines(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address</Label>
            <Textarea
              id="address"
              placeholder="Enter your complete delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91-98300-12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="urgent" 
              checked={isUrgent}
              onCheckedChange={(checked) => setIsUrgent(checked as boolean)}
            />
            <Label 
              htmlFor="urgent" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              This is urgent
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Placing Order..." : "Place Order"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
