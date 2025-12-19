import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const DebugClinicsPage = () => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const fetchData = async () => {
    // Check auth
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    console.log('Current user:', currentUser);

    // Fetch clinics
    const { data, error: fetchError } = await supabase
      .from('clinics')
      .select('*');
    
    console.log('Clinics query result:', { data, error: fetchError });
    
    if (fetchError) {
      setError(fetchError.message);
      console.error('Error:', fetchError);
    } else {
      setClinics(data || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Debug: Clinics Query</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div>
              <p className="text-green-600">✅ Logged in</p>
              <p className="text-sm">User ID: {user.id}</p>
              <p className="text-sm">Email: {user.email}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ Not logged in</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Query Result</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchData} className="mb-4">Refresh</Button>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          <p className="mb-4">
            <strong>Total clinics found:</strong> {clinics.length}
          </p>
          
          {clinics.length === 0 ? (
            <p className="text-muted-foreground">No clinics in database</p>
          ) : (
            <div className="space-y-3">
              {clinics.map((clinic) => (
                <div key={clinic.id} className="p-4 border rounded">
                  <p className="font-bold">{clinic.clinic_name}</p>
                  <p className="text-sm">Email: {clinic.email}</p>
                  <p className="text-sm">Address: {clinic.address}</p>
                  <p className="text-sm">User ID: {clinic.user_id || 'NULL (dummy data)'}</p>
                  <p className="text-sm">Verified: {clinic.verified ? '✅' : '❌'}</p>
                  <p className="text-xs text-muted-foreground">ID: {clinic.id}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>If you see an error:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Copy the error message</li>
            <li>Go to Supabase Dashboard → SQL Editor</li>
            <li>Run the SQL from <code>FIX_CLINIC_VISIBILITY.sql</code></li>
            <li>Come back and click "Refresh"</li>
          </ol>
          
          <p className="mt-4"><strong>If you see 0 clinics:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Run the SQL from <code>ADD_DUMMY_DATA_FIXED.sql</code></li>
            <li>Or register a clinic account</li>
            <li>Come back and click "Refresh"</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};
