import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Clinic {
  id: string;
  clinic_name: string;
  address?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

interface BookAppointmentProps {
  onSuccess?: () => void;
}

export const BookAppointment = ({ onSuccess }: BookAppointmentProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchClinics();
    }
  }, [open]);

  useEffect(() => {
    if (selectedClinic) {
      fetchDoctors(selectedClinic);
    }
  }, [selectedClinic]);

  const fetchClinics = async () => {
    console.log('Fetching clinics...');
    const { data, error } = await supabase
      .from('clinics')
      .select('id, clinic_name, address')
      .order('clinic_name');
    
    console.log('Clinics data:', data);
    console.log('Clinics error:', error);
    
    if (!error && data) {
      setClinics(data);
      console.log('Clinics set:', data.length, 'clinics');
    } else if (error) {
      console.error('Error fetching clinics:', error);
      toast.error(`Failed to load clinics: ${error.message}`);
    }
  };

  const fetchDoctors = async (clinicId: string) => {
    console.log('Fetching doctors for clinic:', clinicId);
    
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        id,
        name,
        specialties (name)
      `)
      .eq('clinic_id', clinicId)
      .eq('available', true);
    
    console.log('Doctors query result:', { data, error });
    
    if (!error && data) {
      const doctorsList = data.map(d => ({
        id: d.id,
        name: d.name,
        specialty: (d.specialties as any)?.name || 'General'
      }));
      setDoctors(doctorsList);
      console.log('Doctors set:', doctorsList.length, 'doctors');
    } else if (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to book an appointment");
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          clinic_id: selectedClinic,
          doctor_id: selectedDoctor || null,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          notes: notes || null,
          status: 'pending'
        });

      if (error) {
        toast.error("Failed to book appointment");
      } else {
        toast.success("Appointment booked successfully!");
        setOpen(false);
        resetForm();
        onSuccess?.();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClinic("");
    setSelectedDoctor("");
    setAppointmentDate("");
    setAppointmentTime("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Calendar className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            Choose a clinic and doctor to book your appointment
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinic">Select Clinic</Label>
            <Select value={selectedClinic} onValueChange={setSelectedClinic} required>
              <SelectTrigger id="clinic">
                <SelectValue placeholder="Choose a clinic" />
              </SelectTrigger>
              <SelectContent>
                {clinics.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No clinics available</div>
                ) : (
                  clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{clinic.clinic_name}</span>
                        {clinic.address && (
                          <span className="text-xs text-muted-foreground">{clinic.address}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedClinic && (
            <div className="space-y-2">
              <Label htmlFor="doctor">Select Doctor (Optional)</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No doctors available for this clinic</div>
                  ) : (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific concerns or symptoms..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Booking..." : "Book Appointment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
