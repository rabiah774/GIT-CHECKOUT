import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Calendar, Package, Activity, Clock, MapPin, Stethoscope, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-doctors.jpg";
import { useAuth } from "@/hooks/useAuth";

const Home = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'patient') {
        navigate('/dashboard/patient');
      } else if (role === 'pharmacy') {
        navigate('/dashboard/pharmacy');
      } else if (role === 'clinic') {
        navigate('/dashboard/clinic');
      }
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/20 to-accent/5">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                A Unified Hyperlocal Healthcare Hub
              </h1>
              <p className="text-xl text-muted-foreground">
                Connecting Patients, Pharmacies, and Clinics — all in one digital ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg">
                  <Link to="/register">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg">
                  <Link to="/register?role=provider">Join as Pharmacy / Clinic</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Healthcare professionals" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-card shadow-lg -mt-8 mx-4 md:mx-12 rounded-2xl relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by Doctor, Specialty, or Clinic..." 
                className="pl-10 h-14 text-lg"
              />
            </div>
            <Button size="lg" className="h-14 px-8 text-lg">
              Search
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Near: Your Location/City</span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-primary" />
              <p className="font-semibold">Book Appointment</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center space-y-2">
              <Package className="w-8 h-8 mx-auto text-accent" />
              <p className="font-semibold">Order for Takeaway</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center space-y-2">
              <Clock className="w-8 h-8 mx-auto text-success" />
              <p className="font-semibold">View My Appointments</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center space-y-2">
              <MapPin className="w-8 h-8 mx-auto text-warning" />
              <p className="font-semibold">Find a Pharmacy</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Healthcare Made Simple
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Patient View</h3>
                <p className="text-muted-foreground">
                  Find & Book Local Clinics, Track Health Memory, and manage all your medical appointments in one place.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold">Pharmacy View</h3>
                <p className="text-muted-foreground">
                  Smart Inventory Management, Digital Appointments, and AI-powered prescription scanning.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-success transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-2xl font-bold">Clinic View</h3>
                <p className="text-muted-foreground">
                  Manage Doctor Schedules, Emergency Alerts, and Patient Health Insights all in one dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Create Your Account</h3>
                <p className="text-muted-foreground">
                  Sign up as a Patient, Pharmacy, or Clinic with email verification for secure access.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Search & Connect</h3>
                <p className="text-muted-foreground">
                  Find local healthcare providers, view availability, and book appointments instantly.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-success text-success-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Manage Everything</h3>
                <p className="text-muted-foreground">
                  Track appointments, manage prescriptions, and access your complete health records from your personalized dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Kllinic
              </h3>
              <p className="text-muted-foreground">
                The Hyperlocal Healthcare Hub connecting communities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Patients</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Find Doctors</li>
                <li>Book Appointments</li>
                <li>Health Records</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Join as Clinic</li>
                <li>Join as Pharmacy</li>
                <li>Manage Dashboard</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>support@kllinic.com</li>
                <li>+1 (555) 123-4567</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
            <p>&copy; 2025 Kllinic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
