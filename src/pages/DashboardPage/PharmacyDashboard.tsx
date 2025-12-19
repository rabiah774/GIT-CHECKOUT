import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Package, AlertCircle, Upload, Calendar, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { toast } from "sonner";
import { BillGenerator } from "@/components/BillGenerator";
import { StockManagement } from "@/components/StockManagement";
import { AIStockUpdater } from "@/components/AIStockUpdater";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface MedicineOrder {
  id: string;
  medicines: string;
  delivery_address: string;
  phone: string;
  payment_method: string;
  is_urgent: boolean;
  status: string;
  notes: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const PharmacyDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [pharmacyName, setPharmacyName] = useState<string>("Pharmacy");
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pharmacyAddress, setPharmacyAddress] = useState<string>("");
  const [pharmacyPhone, setPharmacyPhone] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPharmacyData();
    }
  }, [user]);

  useEffect(() => {
    if (pharmacyId) {
      fetchOrders();
    }
  }, [pharmacyId]);

  const fetchPharmacyData = async () => {
    if (!user?.id) return;
    
    console.log('Fetching pharmacy data for user:', user.id);
    
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id, pharmacy_name, address, phone')
      .eq('user_id', user.id)
      .single();

    console.log('Pharmacy data result:', { data, error });

    if (!error && data) {
      setPharmacyName(data.pharmacy_name);
      setPharmacyId(data.id);
      setPharmacyAddress(data.address || "");
      setPharmacyPhone(data.phone || "");
      console.log('Pharmacy found:', data.pharmacy_name, 'ID:', data.id);
    } else if (error) {
      console.error('Error fetching pharmacy data:', error);
    }
  };

  const fetchOrders = async () => {
    if (!pharmacyId) {
      console.log('No pharmacy ID found');
      return;
    }

    console.log('Fetching orders for pharmacy ID:', pharmacyId);

    // First get the orders without the profiles join
    const { data: ordersData, error: ordersError } = await supabase
      .from('medicine_orders')
      .select(`
        id,
        patient_id,
        medicines,
        delivery_address,
        phone,
        payment_method,
        is_urgent,
        status,
        notes,
        created_at
      `)
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false });

    console.log('Orders query result:', { data: ordersData, error: ordersError });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }

    if (!ordersData || ordersData.length === 0) {
      setOrders([]);
      setPendingOrders(0);
      console.log('No orders found');
      return;
    }

    // Get patient names separately
    const patientIds = [...new Set(ordersData.map(order => order.patient_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', patientIds);

    // Combine the data
    const ordersWithProfiles = ordersData.map(order => ({
      ...order,
      profiles: {
        full_name: profilesData?.find(p => p.id === order.patient_id)?.full_name || 'Unknown Patient'
      }
    }));

    setOrders(ordersWithProfiles as any);
    const pending = ordersWithProfiles.filter(order => order.status === 'pending').length;
    setPendingOrders(pending);
    console.log('Orders set:', ordersWithProfiles.length, 'total,', pending, 'pending');
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('medicine_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update order');
    } else {
      toast.success(`Order ${newStatus}`);
      fetchOrders();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      setPharmacyName("Pharmacy");
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  const urgentOrders = orders.filter(order => order.is_urgent && order.status === 'pending');
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at).toDateString();
    const today = new Date().toDateString();
    return orderDate === today;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Kllinic Pharmacy</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Hello, {pharmacyName}</span>
            <div className="flex gap-2">
              <StockManagement pharmacyId={pharmacyId || ""} />
              <BillGenerator 
                pharmacyName={pharmacyName}
                pharmacyAddress={pharmacyAddress}
                pharmacyPhone={pharmacyPhone}
              />
            </div>
            <DarkModeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Pharmacy Dashboard</h2>
          <p className="text-muted-foreground">Manage inventory and patient orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </div>
                <Package className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Orders</p>
                  <p className="text-3xl font-bold">{todayOrders.length}</p>
                </div>
                <Calendar className="w-10 h-10 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-3xl font-bold text-warning">{pendingOrders}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Urgent Orders</p>
                  <p className="text-3xl font-bold text-destructive">{urgentOrders.length}</p>
                </div>
                <TrendingDown className="w-10 h-10 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Orders Alert */}
        {urgentOrders.length > 0 && (
          <Card className="mb-8 border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Urgent Orders ({urgentOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentOrders.map((order) => (
                <div key={order.id} className="flex items-start justify-between p-4 bg-card border border-destructive/30 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{order.profiles.full_name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Medicines:</strong> {order.medicines}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Address:</strong> {order.delivery_address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Phone:</strong> {order.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Payment:</strong> {order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online'}
                    </p>
                    {order.notes && (
                      <p className="text-xs text-muted-foreground mt-1">Note: {order.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Badge variant="destructive">URGENT</Badge>
                    <Button 
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Pending Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {orders.filter(o => o.status === 'pending' && !o.is_urgent).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending orders</p>
              ) : (
                orders.filter(o => o.status === 'pending' && !o.is_urgent).map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{order.profiles.full_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <p className="text-sm mt-2">
                      <strong>Medicines:</strong> {order.medicines}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Address:</strong> {order.delivery_address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Phone:</strong> {order.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Payment:</strong> {order.payment_method === 'cash_on_delivery' ? 'COD' : 'Online'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* All Orders */}
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders yet</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{order.profiles.full_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {order.is_urgent && <Badge variant="destructive">URGENT</Badge>}
                        <Badge variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'pending' ? 'secondary' :
                          order.status === 'cancelled' ? 'destructive' :
                          'outline'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm">
                      <strong>Medicines:</strong> {order.medicines}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Payment:</strong> {order.payment_method === 'cash_on_delivery' ? 'COD' : 'Online'}
                    </p>
                    
                    {/* Status Update Buttons */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div className="flex gap-2 mt-3">
                        {order.status === 'pending' && (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <Button 
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button 
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                          >
                            Out for Delivery
                          </Button>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <Button 
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Stock Auto Updater */}
        <AIStockUpdater pharmacyId={pharmacyId || ""} />

      </main>
    </div>
  );
};

export default PharmacyDashboard;
