import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Activity, User, Building2, Package } from "lucide-react";
import { toast } from "sonner";
import { signUp, signupSchema } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const defaultTab = searchParams.get("role") === "provider" ? "pharmacy" : "patient";
  
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && role && !authLoading) {
      if (role === 'patient') navigate('/dashboard/patient');
      else if (role === 'pharmacy') navigate('/dashboard/pharmacy');
      else if (role === 'clinic') navigate('/dashboard/clinic');
    }
  }, [user, role, authLoading, navigate]);

  // Patient form
  const [patientData, setPatientData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Pharmacy form
  const [pharmacyData, setPharmacyData] = useState({
    pharmacyName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  // Clinic form
  const [clinicData, setClinicData] = useState({
    clinicName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  const handlePatientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const validated = signupSchema.parse({ 
        full_name: patientData.name,
        email: patientData.email,
        password: patientData.password,
      });
      const { error } = await signUp(validated, 'patient');
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Registration successful! Please check your email to verify your account.");
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePharmacyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const validated = signupSchema.parse({
        full_name: pharmacyData.pharmacyName,
        email: pharmacyData.email,
        password: pharmacyData.password,
        phone: pharmacyData.phone,
        address: pharmacyData.address,
      });
      const { error } = await signUp(validated, 'pharmacy');
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Registration successful! Please check your email to verify your account.");
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClinicRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const validated = signupSchema.parse({
        full_name: clinicData.clinicName,
        email: clinicData.email,
        password: clinicData.password,
        phone: clinicData.phone,
        address: clinicData.address,
      });
      const { error } = await signUp(validated, 'clinic');
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Registration successful! Please check your email to verify your account.");
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/20 to-accent/5 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Activity className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Join Kllinic</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="patient" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient
              </TabsTrigger>
              <TabsTrigger value="pharmacy" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Pharmacy
              </TabsTrigger>
              <TabsTrigger value="clinic" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Clinic
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patient" className="mt-6">
              <form onSubmit={handlePatientRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-name">Full Name</Label>
                  <Input
                    id="patient-name"
                    placeholder="John Doe"
                    value={patientData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientData({ ...patientData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-email">Email</Label>
                  <Input
                    id="patient-email"
                    type="email"
                    placeholder="john@example.com"
                    value={patientData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientData({ ...patientData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-password">Password</Label>
                  <Input
                    id="patient-password"
                    type="password"
                    placeholder="••••••••"
                    value={patientData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientData({ ...patientData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Patient Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="pharmacy" className="mt-6">
              <form onSubmit={handlePharmacyRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pharmacy-name">Pharmacy Name</Label>
                  <Input
                    id="pharmacy-name"
                    placeholder="Health Plus Pharmacy"
                    value={pharmacyData.pharmacyName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPharmacyData({ ...pharmacyData, pharmacyName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacy-email">Email</Label>
                  <Input
                    id="pharmacy-email"
                    type="email"
                    placeholder="contact@pharmacy.com"
                    value={pharmacyData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPharmacyData({ ...pharmacyData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacy-phone">Phone Number</Label>
                  <Input
                    id="pharmacy-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={pharmacyData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPharmacyData({ ...pharmacyData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacy-address">Address</Label>
                  <Input
                    id="pharmacy-address"
                    placeholder="123 Main St, City, State"
                    value={pharmacyData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPharmacyData({ ...pharmacyData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacy-password">Password</Label>
                  <Input
                    id="pharmacy-password"
                    type="password"
                    placeholder="••••••••"
                    value={pharmacyData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPharmacyData({ ...pharmacyData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Pharmacy Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="clinic" className="mt-6">
              <form onSubmit={handleClinicRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">Clinic Name</Label>
                  <Input
                    id="clinic-name"
                    placeholder="City Medical Center"
                    value={clinicData.clinicName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClinicData({ ...clinicData, clinicName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-email">Email</Label>
                  <Input
                    id="clinic-email"
                    type="email"
                    placeholder="info@clinic.com"
                    value={clinicData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClinicData({ ...clinicData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">Phone Number</Label>
                  <Input
                    id="clinic-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={clinicData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClinicData({ ...clinicData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-address">Address</Label>
                  <Input
                    id="clinic-address"
                    placeholder="456 Healthcare Ave, City, State"
                    value={clinicData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClinicData({ ...clinicData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-password">Password</Label>
                  <Input
                    id="clinic-password"
                    type="password"
                    placeholder="••••••••"
                    value={clinicData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClinicData({ ...clinicData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Clinic Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
