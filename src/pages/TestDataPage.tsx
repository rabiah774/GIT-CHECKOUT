import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const TestDataPage = () => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch clinics
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('*');
      
      if (clinicsError) {
        setError(`Clinics Error: ${clinicsError.message}`);
        console.error('Clinics error:', clinicsError);
      } else {
        setClinics(clinicsData || []);
      }

      // Fetch pharmacies
      const { data: pharmaciesData, error: pharmaciesError } = await supabase
        .from('pharmacies')
        .select('*');
      
      if (pharmaciesError) {
        setError(`Pharmacies Error: ${pharmaciesError.message}`);
        console.error('Pharmacies error:', pharmaciesError);
      } else {
        setPharmacies(pharmaciesData || []);
      }
    } catch (err) {
      setError(`Error: ${err}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Database Test Page</h1>
      
      <Button onClick={fetchData} className="mb-4">
        Refresh Data
      </Button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && <p>Loading...</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clinics ({clinics.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clinics.length === 0 ? (
              <p className="text-muted-foreground">No clinics found in database</p>
            ) : (
              <div className="space-y-2">
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="p-3 border rounded">
                    <p className="font-semibold">{clinic.clinic_name}</p>
                    <p className="text-sm text-muted-foreground">{clinic.address}</p>
                    <p className="text-xs">Verified: {clinic.verified ? '✅' : '❌'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pharmacies ({pharmacies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pharmacies.length === 0 ? (
              <p className="text-muted-foreground">No pharmacies found in database</p>
            ) : (
              <div className="space-y-2">
                {pharmacies.map((pharmacy) => (
                  <div key={pharmacy.id} className="p-3 border rounded">
                    <p className="font-semibold">{pharmacy.pharmacy_name}</p>
                    <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                    <p className="text-xs">Verified: {pharmacy.verified ? '✅' : '❌'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>If you see "No clinics/pharmacies found", you need to add dummy data:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Go to your Supabase Dashboard: <a href="https://nfijoztlzlfltbghydpy.supabase.co" target="_blank" className="text-blue-600 underline">Open Dashboard</a></li>
            <li>Click "SQL Editor" in the left sidebar</li>
            <li>Open the file: <code className="bg-gray-100 px-1">QUICK_SETUP_DUMMY_DATA.md</code></li>
            <li>Copy the SQL script and paste it in the SQL Editor</li>
            <li>Click "Run" to execute</li>
            <li>Come back here and click "Refresh Data"</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};
