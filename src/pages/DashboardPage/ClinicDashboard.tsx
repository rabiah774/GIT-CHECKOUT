import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Calendar, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { toast } from "sonner";
import { DoctorManagement } from "@/components/DoctorManagement";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string;
  profiles: {
    full_name: string;
  };
  doctors: {
    name: string;
    specialties: {
      name: string;
    };
  } | null;
}

const ClinicDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [clinicName, setClinicName] = useState<string>("Clinic");
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchClinicData();
    }
  }, [user]);

  useEffect(() => {
    if (clinicId) {
      fetchAppointments();
    }
  }, [clinicId]);

  const fetchClinicData = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('clinics')
      .select('id, clinic_name')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setClinicName(data.clinic_name);
      setClinicId(data.id);
    }
  };

  const fetchAppointments = async () => {
    if (!clinicId) return;

    // First get appointments
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        patient_id,
        doctor_id,
        doctors (
          name,
          specialties (name)
        )
      `)
      .eq('clinic_id', clinicId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return;
    }

    if (!appointmentsData || appointmentsData.length === 0) {
      setAppointments([]);
      setTodayAppointments(0);
      return;
    }

    // Get patient names separately
    const patientIds = [...new Set(appointmentsData.map(apt => apt.patient_id))];
    console.log('Patient IDs:', patientIds);
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', patientIds);

    console.log('Profiles data:', profilesData);
    console.log('Profiles error:', profilesError);

    // Combine the data
    const appointmentsWithProfiles = appointmentsData.map(apt => {
      const profile = profilesData?.find(p => p.id === apt.patient_id);
      console.log(`Appointment ${apt.id} - Patient ID: ${apt.patient_id}, Profile found:`, profile);
      return {
        ...apt,
        profiles: {
          full_name: profile?.full_name || 'Unknown Patient'
        }
      };
    });

    setAppointments(appointmentsWithProfiles as any);
    
    // Count today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayCount = appointmentsWithProfiles.filter(apt => apt.appointment_date === today).length;
    setTodayAppointments(todayCount);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      setClinicName("Clinic");
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId);

    if (error) {
      toast.error('Failed to update appointment');
    } else {
      toast.success(`Appointment ${newStatus}`);
      fetchAppointments();
    }
  };

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Kllinic</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Hello, {clinicName}</span>
            <DoctorManagement clinicId={clinicId || ""} />
            <DarkModeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Clinic Dashboard</h2>
          <p className="text-muted-foreground">Monitor operations and manage healthcare services</p>
        </div>



        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Appointments</p>
                  <p className="text-3xl font-bold">{appointments.length}</p>
                </div>
                <Calendar className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
                  <p className="text-3xl font-bold">{todayAppointments}</p>
                </div>
                <Activity className="w-10 h-10 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold">{pendingAppointments.length}</p>
                </div>
                <Clock className="w-10 h-10 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-3xl font-bold">{confirmedAppointments.length}</p>
                </div>
                <Users className="w-10 h-10 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Appointments */}
        {pendingAppointments.length > 0 && (
          <Card className="mb-8 border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                Pending Appointments ({pendingAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 bg-card border border-warning/30 rounded-lg">
                  <div>
                    <h4 className="font-semibold">{apt.profiles.full_name}</h4>
                    {apt.doctors && (
                      <p className="text-sm text-muted-foreground">
                        Dr. {apt.doctors.name} - {(apt.doctors.specialties as any)?.name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                    </p>
                    {apt.notes && (
                      <p className="text-xs text-muted-foreground mt-1">Note: {apt.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                    >
                      Confirm
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Confirmed Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Confirmed Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {confirmedAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No confirmed appointments</p>
              ) : (
                confirmedAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{apt.profiles.full_name}</h4>
                          {apt.doctors && (
                            <p className="text-sm text-muted-foreground">
                              Dr. {apt.doctors.name} - {(apt.doctors.specialties as any)?.name}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                          </p>
                          {apt.notes && (
                            <p className="text-xs text-muted-foreground mt-1">Note: {apt.notes}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="default">Confirmed</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* All Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {appointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No appointments yet</p>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{apt.profiles.full_name}</h4>
                        {apt.doctors && (
                          <p className="text-sm text-muted-foreground">
                            Dr. {apt.doctors.name}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        apt.status === 'confirmed' ? 'default' :
                        apt.status === 'pending' ? 'secondary' :
                        apt.status === 'completed' ? 'outline' :
                        'destructive'
                      }>
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClinicDashboard;
