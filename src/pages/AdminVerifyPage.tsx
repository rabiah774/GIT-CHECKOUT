import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface Clinic {
  id: string;
  clinic_name: string;
  email: string;
  phone: string;
  address: string;
  verified: boolean;
  created_at: string;
}

interface Pharmacy {
  id: string;
  pharmacy_name: string;
  email: string;
  phone: string;
  address: string;
  verified: boolean;
  created_at: string;
}

export const AdminVerifyPage = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all clinics
    const { data: clinicsData, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!clinicsError && clinicsData) {
      setClinics(clinicsData);
    }

    // Fetch all pharmacies
    const { data: pharmaciesData, error: pharmaciesError } = await supabase
      .from('pharmacies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!pharmaciesError && pharmaciesData) {
      setPharmacies(pharmaciesData);
    }

    setLoading(false);
  };

  const verifyClinic = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('clinics')
      .update({ verified: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update clinic');
    } else {
      toast.success(`Clinic ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      fetchData();
    }
  };

  const verifyPharmacy = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('pharmacies')
      .update({ verified: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update pharmacy');
    } else {
      toast.success(`Pharmacy ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      fetchData();
    }
  };

  const verifyAllReal = async () => {
    // Verify all non-dummy clinics
    const { error: clinicsError } = await supabase
      .from('clinics')
      .update({ verified: true })
      .neq('email', 'contact@parkstreetmedical.com')
      .neq('email', 'info@saltlakehospital.com')
      .neq('email', 'hello@gariahatclinic.com')
      .neq('email', 'contact@howrahhospital.com');

    // Verify all non-dummy pharmacies
    const { error: pharmaciesError } = await supabase
      .from('pharmacies')
      .update({ verified: true })
      .neq('email', 'contact@apolloparkst.com')
      .neq('email', 'info@medplusgariahat.com')
      .neq('email', 'hello@healthbuddysaltlake.com')
      .neq('email', 'support@wellnesshowrah.com');

    if (!clinicsError && !pharmaciesError) {
      toast.success('All real clinics and pharmacies verified!');
      fetchData();
    } else {
      toast.error('Failed to verify some entries');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin - Verify Clinics & Pharmacies</h1>
        <Button onClick={verifyAllReal} variant="default">
          Verify All Real Registrations
        </Button>
      </div>

      {loading && <p>Loading...</p>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Clinics */}
        <Card>
          <CardHeader>
            <CardTitle>Clinics ({clinics.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{clinic.clinic_name}</h3>
                    <p className="text-sm text-muted-foreground">{clinic.email}</p>
                  </div>
                  <Badge variant={clinic.verified ? "default" : "secondary"}>
                    {clinic.verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
                <p className="text-sm mb-1">{clinic.phone}</p>
                <p className="text-sm text-muted-foreground mb-3">{clinic.address}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Registered: {new Date(clinic.created_at).toLocaleDateString()}
                </p>
                <Button
                  size="sm"
                  variant={clinic.verified ? "outline" : "default"}
                  onClick={() => verifyClinic(clinic.id, clinic.verified)}
                  className="w-full"
                >
                  {clinic.verified ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Unverify
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pharmacies */}
        <Card>
          <CardHeader>
            <CardTitle>Pharmacies ({pharmacies.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {pharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{pharmacy.pharmacy_name}</h3>
                    <p className="text-sm text-muted-foreground">{pharmacy.email}</p>
                  </div>
                  <Badge variant={pharmacy.verified ? "default" : "secondary"}>
                    {pharmacy.verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
                <p className="text-sm mb-1">{pharmacy.phone}</p>
                <p className="text-sm text-muted-foreground mb-3">{pharmacy.address}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Registered: {new Date(pharmacy.created_at).toLocaleDateString()}
                </p>
                <Button
                  size="sm"
                  variant={pharmacy.verified ? "outline" : "default"}
                  onClick={() => verifyPharmacy(pharmacy.id, pharmacy.verified)}
                  className="w-full"
                >
                  {pharmacy.verified ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Unverify
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
