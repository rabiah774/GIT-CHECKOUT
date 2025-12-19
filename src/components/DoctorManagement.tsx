import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Edit, Trash2, Stethoscope, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Doctor {
  id: string;
  name: string;
  qualification: string;
  experience_years: number;
  available: boolean;
  created_at: string;
  specialties: {
    id: string;
    name: string;
  } | null;
}

interface Specialty {
  id: string;
  name: string;
}

interface DoctorManagementProps {
  clinicId: string;
}

export const DoctorManagement = ({ clinicId }: DoctorManagementProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Form states
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    specialty_id: "",
    qualification: "",
    experience_years: 0,
    available: true
  });

  useEffect(() => {
    if (open && clinicId) {
      fetchDoctors();
      fetchSpecialties();
    }
  }, [open, clinicId]);

  const fetchDoctors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        id,
        name,
        qualification,
        experience_years,
        available,
        created_at,
        specialties (
          id,
          name
        )
      `)
      .eq('clinic_id', clinicId)
      .order('name');

    if (!error && data) {
      setDoctors(data as any);
    } else if (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
    setLoading(false);
  };

  const fetchSpecialties = async () => {
    const { data, error } = await supabase
      .from('specialties')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setSpecialties(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDoctor) {
        // Update existing doctor
        const { error } = await supabase
          .from('doctors')
          .update(formData)
          .eq('id', editingDoctor.id);

        if (error) throw error;
        toast.success('Doctor updated successfully!');
      } else {
        // Create new doctor
        const { error } = await supabase
          .from('doctors')
          .insert({
            ...formData,
            clinic_id: clinicId
          });

        if (error) throw error;
        toast.success('Doctor added successfully!');
      }

      resetForm();
      fetchDoctors();
    } catch (error: any) {
      console.error('Error saving doctor:', error);
      toast.error('Failed to save doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      specialty_id: doctor.specialties?.id || "",
      qualification: doctor.qualification || "",
      experience_years: doctor.experience_years || 0,
      available: doctor.available
    });
    setActiveTab("add");
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this doctor?')) return;

    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove doctor');
    } else {
      toast.success('Doctor removed successfully!');
      fetchDoctors();
    }
  };

  const toggleAvailability = async (doctorId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('doctors')
      .update({ available: !currentStatus })
      .eq('id', doctorId);

    if (error) {
      toast.error('Failed to update availability');
    } else {
      toast.success(`Doctor ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchDoctors();
    }
  };

  const resetForm = () => {
    setEditingDoctor(null);
    setFormData({
      name: "",
      specialty_id: "",
      qualification: "",
      experience_years: 0,
      available: true
    });
    setActiveTab("all");
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialties?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.qualification?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'available') return matchesSearch && doctor.available;
    if (activeTab === 'unavailable') return matchesSearch && !doctor.available;
    
    return matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Manage Doctors
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Doctor Management</DialogTitle>
          <DialogDescription>
            Add and manage doctors in your clinic
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Doctors ({doctors.length})</TabsTrigger>
            <TabsTrigger value="available">Available ({doctors.filter(d => d.available).length})</TabsTrigger>
            <TabsTrigger value="unavailable">Unavailable ({doctors.filter(d => !d.available).length})</TabsTrigger>
            <TabsTrigger value="add">{editingDoctor ? 'Edit' : 'Add'} Doctor</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search doctors by name, specialty, or qualification..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setActiveTab("add")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Doctor
              </Button>
            </div>

            <div className="grid gap-4 max-h-[500px] overflow-y-auto">
              {loading ? (
                <p className="text-center py-8">Loading doctors...</p>
              ) : filteredDoctors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No doctors found</p>
              ) : (
                filteredDoctors.map((doctor) => (
                  <Card key={doctor.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Stethoscope className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">Dr. {doctor.name}</h4>
                              <Badge variant={doctor.available ? "default" : "secondary"}>
                                {doctor.available ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><strong>Specialty:</strong> {doctor.specialties?.name || 'General'}</p>
                                <p><strong>Qualification:</strong> {doctor.qualification || 'N/A'}</p>
                              </div>
                              <div>
                                <p><strong>Experience:</strong> {doctor.experience_years || 0} years</p>
                                <p><strong>Added:</strong> {new Date(doctor.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={doctor.available}
                              onCheckedChange={() => toggleAvailability(doctor.id, doctor.available)}
                            />
                            <Label className="text-sm">Available</Label>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(doctor)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(doctor.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="available">
            <div className="grid gap-4 max-h-[500px] overflow-y-auto">
              {doctors.filter(d => d.available).map((doctor) => (
                <Card key={doctor.id} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-500" />
                      <h4 className="font-semibold">Dr. {doctor.name}</h4>
                      <Badge variant="default">Available</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {doctor.specialties?.name} • {doctor.experience_years} years experience
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="unavailable">
            <div className="grid gap-4 max-h-[500px] overflow-y-auto">
              {doctors.filter(d => !d.available).map((doctor) => (
                <Card key={doctor.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-gray-500" />
                      <h4 className="font-semibold">Dr. {doctor.name}</h4>
                      <Badge variant="secondary">Unavailable</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {doctor.specialties?.name} • {doctor.experience_years} years experience
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="add">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Doctor Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Doctor Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter doctor's full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Specialty *</Label>
                      <Select value={formData.specialty_id} onValueChange={(value) => setFormData({...formData, specialty_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map((specialty) => (
                            <SelectItem key={specialty.id} value={specialty.id}>
                              {specialty.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Qualification</Label>
                      <Input
                        value={formData.qualification}
                        onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                        placeholder="e.g., MBBS, MD, MS"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Years of Experience</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                        placeholder="Enter years of experience"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.available}
                        onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                      />
                      <Label>Available for appointments</Label>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium mb-2">Note:</h5>
                      <p className="text-sm text-muted-foreground">
                        Available doctors will appear in the patient booking system. 
                        You can toggle availability anytime using the switch.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={resetForm}>
                  {editingDoctor ? 'Cancel' : 'Reset'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};