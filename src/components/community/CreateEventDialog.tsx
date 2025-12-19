import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CreateEventDialogProps {
  onSuccess: () => void;
}

export const CreateEventDialog = ({ onSuccess }: CreateEventDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClinic, setIsClinic] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "health_camp",
    event_date: "",
    event_time: "",
    location: "",
    max_participants: 50,
    is_free: true,
    cost: 0,
    contact_phone: "",
  });

  // Check if user is a clinic when dialog opens
  useState(() => {
    if (open && user) {
      checkIfClinic();
    }
  });

  const checkIfClinic = async () => {
    const { data, error } = await supabase
      .from('clinics')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (!error && data) {
      setIsClinic(true);
      setClinicId(data.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    const eventData = {
      ...formData,
      clinic_id: isClinic ? clinicId : null,
      cost: formData.is_free ? 0 : formData.cost,
    };

    const { error } = await supabase
      .from('health_events')
      .insert(eventData);

    if (error) {
      toast.error("Failed to create event");
    } else {
      toast.success("Event created successfully!");
      setFormData({
        title: "",
        description: "",
        event_type: "health_camp",
        event_date: "",
        event_time: "",
        location: "",
        max_participants: 50,
        is_free: true,
        cost: 0,
        contact_phone: "",
      });
      setOpen(false);
      onSuccess();
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Health Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type</Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => setFormData({ ...formData, event_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="health_camp">Health Camp</SelectItem>
                <SelectItem value="vaccination">Vaccination Drive</SelectItem>
                <SelectItem value="workshop">Health Workshop</SelectItem>
                <SelectItem value="screening">Health Screening</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Free Health Checkup Camp"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what the event offers..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Date</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_time">Time</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Event venue address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_participants">Maximum Participants</Label>
            <Input
              id="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
              min="1"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
              />
              <Label htmlFor="is_free">Free Event</Label>
            </div>

            {!formData.is_free && (
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="Contact number for inquiries"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};